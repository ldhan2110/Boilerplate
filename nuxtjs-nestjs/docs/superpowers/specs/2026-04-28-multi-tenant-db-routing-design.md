# Multi-Tenant Database Routing — Design Spec

## Overview

Port the Java multi-tenant database-per-tenant architecture to NestJS. Each tenant company gets its own PostgreSQL database. A metadata database stores tenant connection configs. Requests are routed to the correct tenant DB dynamically based on JWT claims.

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tenancy model | Database-per-tenant | Mirrors Java, strongest isolation |
| Tenant ID transport | Separate JWT claim (`tenantId`) | Cleaner than embedding in username |
| Metadata storage | Separate metadata database | Mirrors Java, dedicated connection |
| Module validation | Deferred | DB routing only for now |
| Pool lifecycle | Lazy create + 1hr eviction | Mirrors Java HikariCP pattern |
| Query pattern | QueryFactory (existing) | Consistency with codebase |
| Approach | DataSource Proxy + AsyncLocalStorage | Zero business code changes |

## Architecture

### Request Flow

```
Request → JwtGuard (validates token, attaches user + tenantId to req)
        → TenantInterceptor (pre-warms DataSource, wraps in AsyncLocalStorage)
        → Controller → Service → QueryFactory → Proxy DataSource → Tenant DB
```

### File Structure

```
src/infra/tenant/
  tenant.module.ts                    — Global module, imports metadata, exports routing DS
  tenant-context.ts                   — AsyncLocalStorage wrapper
  interceptors/
    tenant.interceptor.ts             — Pre-warm DS + wrap handler in tenant context
  metadata/
    metadata-database.module.ts       — 'metadata' TypeORM connection
    metadata-query-factory.ts         — METADATA_QUERY_FACTORY token + provider
    entities/
      tenant-master.entity.ts         — TENT_MST entity
      tenant-db-config.entity.ts      — TENT_DB_CFG entity
    tenant-metadata.service.ts        — Queries metadata DB for tenant configs
  datasource/
    tenant-datasource-manager.ts      — Cache, create, validate, evict DataSources
    tenant-datasource.properties.ts   — Pool config from env vars
    tenant-routing-datasource.ts      — JS Proxy factory function
```

## Component Details

### 1. TenantContext

Uses `AsyncLocalStorage` from `node:async_hooks`. Node.js equivalent of Java ThreadLocal but auto-propagates across async/await — no cleanup needed.

**API:**
- `TenantContext.run(tenantId, callback)` — execute callback with tenant set
- `TenantContext.getTenantId()` — returns current tenant ID or null
- `TenantContext.requireTenantId()` — returns tenant ID or throws

### 2. Metadata Database

Separate TypeORM connection named `'metadata'`. Configured via env vars: `METADATA_DB_HOST`, `METADATA_DB_PORT`, `METADATA_DB_NAME`, `METADATA_DB_USERNAME`, `METADATA_DB_PASSWORD`.

**MetadataQueryFactory:** Same `QueryFactory` class, constructed with metadata DataSource. Registered as `METADATA_QUERY_FACTORY` injection token.

**TenantMetadataService:**
- `getTenantDbConfig(tenantId)` — joins TENT_DB_CFG + TENT_MST, returns active config with priority=1
- `isTenantActive(tenantId)` — boolean check on TENT_MST

### 3. TenantDataSourceManager

Manages per-tenant TypeORM DataSource lifecycle.

**Cache:** `Map<string, { dataSource: DataSource; lastAccess: number }>`

**Methods:**
- `getDataSource(tenantId)` — async, check cache → validate → or create new → return
- `getDataSourceSync(tenantId)` — sync, cache-only (used by proxy, guaranteed warm by interceptor)
- `createDataSource(config)` — creates TypeORM DataSource with postgres config, calls `initialize()`
- `validateDataSource(ds)` — `SELECT 1` with 5s timeout
- `evictIdle()` — runs on `setInterval(60_000)`, closes DataSources idle > 1hr
- `shutdownAll()` — `@OnApplicationShutdown()`, destroys all cached DataSources

**Config (env vars with defaults):**
- `TENANT_POOL_MIN=5`
- `TENANT_POOL_MAX=20`
- `TENANT_POOL_IDLE_MS=600000`
- `TENANT_POOL_EVICTION_MS=3600000`
- `TENANT_POOL_CONNECT_TIMEOUT=30000`

### 4. Tenant-Routing DataSource Proxy

JavaScript `Proxy` wrapping metadata DataSource. Intercepts property access:
- If `TenantContext.getTenantId()` is set → delegates to `manager.getDataSourceSync(tenantId)`
- If no tenant (public routes) → falls back to metadata DataSource

### 5. JWT & Request Integration

**JWT payload:** Add `tenantId` field to `JwtPayload` interface.

**AuthService:** Embed `tenantId` in JWT when signing tokens (from user's company).

**TenantInterceptor (global):**
1. Read `request.user.tenantId`
2. If no tenantId (public route) → pass through
3. `await manager.getDataSource(tenantId)` — pre-warm cache
4. `TenantContext.run(tenantId, () => next.handle())` — wrap handler

### 6. Module Wiring

**TenantModule (@Global):**
- Imports MetadataDatabaseModule
- Provides TenantDataSourceManager, TenantMetadataService, TenantInterceptor
- Overrides `DataSource` provider with routing proxy
- Exports DataSource, TenantDataSourceManager

**DatabaseModule changes:**
- Remove PostgresConfigModule import
- Import TenantModule instead
- QueryFactory gets routing DataSource via DI automatically

**AppModule:** No changes beyond DatabaseModule internal restructure.

## Database Schema (Metadata DB)

```sql
CREATE SCHEMA IF NOT EXISTS tenant;

CREATE TABLE tenant.tent_mst (
  tent_id     VARCHAR(20)  PRIMARY KEY,
  tent_nm     VARCHAR(100) NOT NULL,
  use_flg     BOOLEAN      NOT NULL DEFAULT true,
  cre_usr_id  VARCHAR(50)  NOT NULL,
  cre_dt      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  upd_usr_id  VARCHAR(50)  NOT NULL,
  upd_dt      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE tenant.tent_db_cfg (
  tent_id     VARCHAR(20)  NOT NULL REFERENCES tenant.tent_mst(tent_id),
  db_type     VARCHAR(20)  NOT NULL DEFAULT 'postgres',
  db_host     VARCHAR(255) NOT NULL,
  db_port     INTEGER      NOT NULL DEFAULT 5432,
  db_name     VARCHAR(100) NOT NULL,
  db_username VARCHAR(100) NOT NULL,
  db_password VARCHAR(255) NOT NULL,
  priority    INTEGER      NOT NULL DEFAULT 1,
  use_flg     BOOLEAN      NOT NULL DEFAULT true,
  cre_usr_id  VARCHAR(50)  NOT NULL,
  cre_dt      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  upd_usr_id  VARCHAR(50)  NOT NULL,
  upd_dt      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tent_id, priority)
);
```

## Env Vars Added

```env
# Metadata database
METADATA_DB_HOST=localhost
METADATA_DB_PORT=5432
METADATA_DB_NAME=erp-tenant
METADATA_DB_USERNAME=postgres
METADATA_DB_PASSWORD=postgres

# Tenant pool settings
TENANT_POOL_MIN=5
TENANT_POOL_MAX=20
TENANT_POOL_IDLE_MS=600000
TENANT_POOL_EVICTION_MS=3600000
TENANT_POOL_CONNECT_TIMEOUT=30000
```

## Existing Code Impact

| Component | Change |
|-----------|--------|
| QueryFactory | None — injects DataSource, gets proxy |
| All services | None — use QueryFactory unchanged |
| All controllers | None |
| JWT strategy | Add tenantId to payload interface, return with user |
| AuthService | Embed tenantId in JWT signing |
| DatabaseModule | Replace PostgresConfigModule with TenantModule |
| env.validation.ts | Add metadata + tenant pool env vars |
| .env | Add new env vars |

## Future Extensions (Not In Scope)

- Module validation (`@ModuleValid` guard, `TENT_MDL` table)
- Tenant provisioning API (CRUD for tenants + auto DB creation)
- DB password encryption
- Connection retry with exponential backoff (RetryableDataSource)
