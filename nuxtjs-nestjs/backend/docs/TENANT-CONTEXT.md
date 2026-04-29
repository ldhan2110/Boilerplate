# Tenant Context — Multi-Tenant Database Routing

## Architecture Overview

```
Request → JWT (tenantId) → TenantInterceptor → AsyncLocalStorage → Proxy DataSource → Tenant DB
                                ↓
                         MetadataDB (tent_mst + tent_db_cfg)
```

**Pattern**: Database-per-tenant with transparent routing via `AsyncLocalStorage` + ES Proxy.

Three databases involved:
1. **Metadata DB** — stores tenant registry (`tent_mst`) and DB connection configs (`tent_db_cfg`)
2. **Default App DB** — fallback for non-tenant operations (health checks, public endpoints)
3. **Tenant DB(s)** — one per tenant, dynamically connected and cached

---

## How It Works (Request Lifecycle)

### 1. JWT carries `tenantId`
Login embeds `tenantId` in JWT payload. Auth guard decodes it into `request.user.tenantId`.

### 2. TenantInterceptor runs (global)
Registered as `APP_INTERCEPTOR` — runs on every request.

```typescript
// interceptors/tenant.interceptor.ts
const tenantId = request.user?.tenantId;
if (!tenantId) return next.handle(); // skip non-tenant requests

await this.manager.getDataSource(tenantId); // pre-warm cache
return TenantContext.run(tenantId, () => next.handle()); // wrap in ALS
```

**Key**: `TenantContext.run()` sets `tenantId` in `AsyncLocalStorage` for entire request lifecycle — all downstream code (services, repositories) automatically see it.

### 3. Routing DataSource (Proxy)
Default `DataSource` token replaced with ES Proxy:

```typescript
// datasource/tenant-routing-datasource.ts
return new Proxy(fallbackDs, {
  get(target, prop, receiver) {
    const tenantId = TenantContext.getTenantId();
    if (tenantId) {
      const tenantDs = manager.getDataSourceSync(tenantId);
      if (tenantDs) return Reflect.get(tenantDs, prop, receiver);
    }
    return Reflect.get(target, prop, receiver); // fallback
  },
});
```

**Transparent**: Any code injecting `DataSource` or using TypeORM repositories automatically routes to correct tenant DB. No code changes needed in services.

### 4. DataSource Manager (Connection Pool Cache)
`TenantDataSourceManager` manages tenant DB connections:

- **Cache**: `Map<tenantId, { dataSource, lastAccess }>`
- **Dedup**: Pending connections tracked to avoid duplicate init
- **Eviction**: Idle connections evicted every 60s (configurable via `TENANT_POOL_EVICTION_MS`, default 1hr)
- **Shutdown**: All connections destroyed on app shutdown

```
getDataSource(tenantId)     → async, creates if missing (used by interceptor)
getDataSourceSync(tenantId) → sync, cache-only (used by routing proxy)
```

### 5. Metadata Lookup
`TenantMetadataService` queries metadata DB for tenant DB config:

```typescript
// Only returns config if tenant is active (useFlg = 'Y') and priority = 1
await qf.select(TenantDbConfig, 'cfg')
  .innerJoin(TenantMaster, 'mst', 'cfg.tent_id = mst.tent_id')
  .andWhereStrict('mst.tentId = :tenantId', { tenantId })
  .andWhereStrict("mst.useFlg = 'Y'")
  .andWhereStrict("cfg.useFlg = 'Y'")
  .andWhereStrict('cfg.priority = 1')
  .getOne();
```

---

## Database Schema (Metadata DB)

### `tenant.tent_mst` — Tenant Registry
| Column | Type | Description |
|--------|------|-------------|
| `tent_id` | varchar(50) PK | Tenant identifier |
| `tent_nm` | varchar(200) | Tenant name |
| `use_flg` | char(1) | Active flag ('Y'/'N') |
| `tent_crnt_ver` | varchar(4) | Current version |

### `tenant.tent_db_cfg` — DB Connection Config
| Column | Type | Description |
|--------|------|-------------|
| `db_cfg_id` | varchar(36) PK | Config UUID |
| `tent_id` | varchar(50) FK | Tenant reference |
| `db_host` | varchar(255) | Database host |
| `db_port` | int | Database port |
| `db_nm` | varchar(255) | Database name |
| `db_usr_nm` | varchar(255) | DB username |
| `db_pwd` | varchar(500) | DB password (encrypted) |
| `priority` | int | Config priority (1 = primary) |
| `use_flg` | char(1) | Active flag |

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `METADATA_DB_HOST` | — | Metadata DB host |
| `METADATA_DB_PORT` | — | Metadata DB port |
| `METADATA_DB_USERNAME` | — | Metadata DB user |
| `METADATA_DB_PASSWORD` | — | Metadata DB password |
| `METADATA_DB_NAME` | — | Metadata DB name |
| `DB_HOST/PORT/USERNAME/PASSWORD/NAME` | — | Default app DB (fallback) |
| `TENANT_POOL_MIN` | 5 | Min connections per tenant pool |
| `TENANT_POOL_MAX` | 20 | Max connections per tenant pool |
| `TENANT_POOL_IDLE_MS` | 600000 (10m) | Idle timeout per connection |
| `TENANT_POOL_EVICTION_MS` | 3600000 (1hr) | Evict unused tenant DataSource after |
| `TENANT_POOL_CONNECT_TIMEOUT` | 30000 (30s) | Connection timeout |

---

## File Structure

```
infra/tenant/
├── tenant-context.ts              # AsyncLocalStorage wrapper (run/get/require)
├── tenant.module.ts               # Global module, wires everything
├── index.ts                       # Public exports
├── interceptors/
│   └── tenant.interceptor.ts      # Global interceptor: JWT → ALS context
├── datasource/
│   ├── tenant-routing-datasource.ts    # ES Proxy for transparent routing
│   ├── tenant-datasource-manager.ts    # Connection cache + lifecycle
│   └── tenant-datasource.properties.ts # Pool config from env
└── metadata/
    ├── metadata-database.module.ts     # Separate TypeORM connection for metadata DB
    ├── metadata-query-factory.ts       # DI token for metadata QueryFactory
    ├── tenant-metadata.service.ts      # Queries tenant config
    └── entities/
        ├── tenant-master.entity.ts     # tent_mst entity
        └── tenant-db-config.entity.ts  # tent_db_cfg entity
```

---

## Developer Usage

### You don't need to do anything
If your code injects `DataSource` or uses TypeORM repositories — tenant routing is automatic. Interceptor + Proxy handle it.

### Access tenant ID manually
```typescript
import { TenantContext } from '@infra/tenant';

// In service/controller (within request scope):
const tenantId = TenantContext.getTenantId();       // string | null
const tenantId = TenantContext.requireTenantId();    // string (throws if missing)
```

### Non-tenant endpoints
Requests without `tenantId` in JWT skip tenant context entirely — queries hit default app DB.

### Add new tenant
1. Insert row in `tenant.tent_mst` with `use_flg = 'Y'`
2. Insert row in `tenant.tent_db_cfg` with `priority = 1`, `use_flg = 'Y'`, and connection details
3. Ensure target DB exists with same schema as app DB
4. Done — next request with that `tenantId` auto-connects

### Disable tenant
Set `use_flg = 'N'` in `tent_mst`. Next connection attempt returns 404.

---

## Key Design Decisions

- **AsyncLocalStorage over request-scoped providers**: Zero DI overhead, works in any context (events, queues) not just HTTP
- **ES Proxy over custom repository**: Transparent — existing code works without modification
- **Sync cache read in proxy**: Interceptor pre-warms async, proxy reads sync — no async in property access
- **Connection eviction**: Prevents memory leak from inactive tenants
- **Priority field in DB config**: Supports failover configs (priority 2, 3, etc.) — only priority 1 used currently
