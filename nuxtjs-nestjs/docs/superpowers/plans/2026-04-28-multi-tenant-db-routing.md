# Multi-Tenant Database Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add database-per-tenant routing to NestJS backend, mirroring the Java multi-tenant architecture.

**Architecture:** AsyncLocalStorage holds tenant ID per request. A JS Proxy wraps the default TypeORM DataSource and delegates to tenant-specific DataSources managed by TenantDataSourceManager. A global interceptor pre-warms the tenant DataSource and sets the async context after JWT authentication.

**Tech Stack:** NestJS, TypeORM, PostgreSQL, AsyncLocalStorage (node:async_hooks), JS Proxy

---

## File Structure

### New Files
```
src/infra/tenant/
  tenant.module.ts                          — Global tenant module
  tenant-context.ts                         — AsyncLocalStorage wrapper
  interceptors/
    tenant.interceptor.ts                   — Pre-warm DS + wrap handler in tenant context
  metadata/
    metadata-database.module.ts             — 'metadata' TypeORM connection
    metadata-query-factory.ts               — METADATA_QUERY_FACTORY token + provider
    entities/
      tenant-master.entity.ts               — tent_mst entity
      tenant-db-config.entity.ts            — tent_db_cfg entity
    tenant-metadata.service.ts              — Queries metadata DB
  datasource/
    tenant-datasource-manager.ts            — Create, cache, validate, evict DataSources
    tenant-datasource.properties.ts         — Pool config from env
    tenant-routing-datasource.ts            — JS Proxy factory
  index.ts                                  — Barrel export
```

### Modified Files
```
src/infra/config/env.validation.ts          — Add metadata + tenant pool env vars
src/infra/database/database.module.ts       — Replace PostgresConfigModule with TenantModule
src/apps/authentication/strategies/jwt.strategy.ts — Add tenantId to JwtPayload
src/apps/authentication/services/auth.service.ts   — Embed tenantId in JWT
src/apps/authentication/dto/login-request.dto.ts   — Add tenantId field
src/apps/authentication/dto/login-response.dto.ts  — Add tenantId field
backend/.env                                — Add metadata + tenant pool env vars
backend/.env.example                        — Add metadata + tenant pool env vars
```

---

### Task 1: TenantContext — AsyncLocalStorage Wrapper

**Files:**
- Create: `src/infra/tenant/tenant-context.ts`

- [ ] **Step 1: Create TenantContext**

```typescript
// src/infra/tenant/tenant-context.ts
import { AsyncLocalStorage } from 'node:async_hooks';

interface TenantStore {
  tenantId: string;
}

const storage = new AsyncLocalStorage<TenantStore>();

export const TenantContext = {
  /**
   * Execute callback with tenantId set in async context.
   * Context auto-propagates across all awaited calls inside.
   */
  run<T>(tenantId: string, callback: () => T): T {
    return storage.run({ tenantId }, callback);
  },

  /** Returns current tenant ID or null if not in a tenant context. */
  getTenantId(): string | null {
    return storage.getStore()?.tenantId ?? null;
  },

  /** Returns current tenant ID or throws if not in a tenant context. */
  requireTenantId(): string {
    const tenantId = storage.getStore()?.tenantId;
    if (!tenantId) {
      throw new Error('No tenant context. Ensure request passes through TenantInterceptor.');
    }
    return tenantId;
  },
};
```

- [ ] **Step 2: Verify file compiles**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/backend && npx tsc --noEmit src/infra/tenant/tenant-context.ts 2>&1 | head -20`
Expected: No errors (or we check manually that the code is syntactically correct)

- [ ] **Step 3: Commit**

```bash
git add src/infra/tenant/tenant-context.ts
git commit -m "feat(tenant): add TenantContext with AsyncLocalStorage"
```

---

### Task 2: Metadata DB Entities

**Files:**
- Create: `src/infra/tenant/metadata/entities/tenant-master.entity.ts`
- Create: `src/infra/tenant/metadata/entities/tenant-db-config.entity.ts`

- [ ] **Step 1: Create TenantMaster entity**

```typescript
// src/infra/tenant/metadata/entities/tenant-master.entity.ts
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '@infra/database/entities/common/base.entity';

@Entity({ name: 'tent_mst', schema: 'tenant' })
export class TenantMaster extends BaseEntity {
  @PrimaryColumn({ name: 'tent_id', length: 20 })
  tentId: string;

  @Column({ name: 'tent_nm', length: 100 })
  tentNm: string;
}
```

- [ ] **Step 2: Create TenantDbConfig entity**

```typescript
// src/infra/tenant/metadata/entities/tenant-db-config.entity.ts
import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '@infra/database/entities/common/base.entity';
import { TenantMaster } from './tenant-master.entity';

@Entity({ name: 'tent_db_cfg', schema: 'tenant' })
export class TenantDbConfig extends BaseEntity {
  @PrimaryColumn({ name: 'tent_id', length: 20 })
  tentId: string;

  @PrimaryColumn({ name: 'priority', type: 'int', default: 1 })
  priority: number;

  @Column({ name: 'db_type', length: 20, default: 'postgres' })
  dbType: string;

  @Column({ name: 'db_host', length: 255 })
  dbHost: string;

  @Column({ name: 'db_port', type: 'int', default: 5432 })
  dbPort: number;

  @Column({ name: 'db_name', length: 100 })
  dbName: string;

  @Column({ name: 'db_username', length: 100 })
  dbUsername: string;

  @Column({ name: 'db_password', length: 255 })
  dbPassword: string;

  @ManyToOne(() => TenantMaster)
  @JoinColumn({ name: 'tent_id' })
  tenant: TenantMaster;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/tenant/metadata/entities/
git commit -m "feat(tenant): add TenantMaster and TenantDbConfig entities"
```

---

### Task 3: Metadata Database Module & QueryFactory

**Files:**
- Create: `src/infra/tenant/metadata/metadata-query-factory.ts`
- Create: `src/infra/tenant/metadata/metadata-database.module.ts`

- [ ] **Step 1: Create MetadataQueryFactory token and provider**

```typescript
// src/infra/tenant/metadata/metadata-query-factory.ts
export const METADATA_QUERY_FACTORY = Symbol('METADATA_QUERY_FACTORY');
```

- [ ] **Step 2: Create MetadataDatabaseModule**

```typescript
// src/infra/tenant/metadata/metadata-database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QueryFactory } from '@infra/database/query-factory/query-factory.service';
import { METADATA_QUERY_FACTORY } from './metadata-query-factory';
import { TenantMaster } from './entities/tenant-master.entity';
import { TenantDbConfig } from './entities/tenant-db-config.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'metadata',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('METADATA_DB_HOST'),
        port: config.get<number>('METADATA_DB_PORT'),
        username: config.get<string>('METADATA_DB_USERNAME'),
        password: config.get<string>('METADATA_DB_PASSWORD'),
        database: config.get<string>('METADATA_DB_NAME'),
        entities: [TenantMaster, TenantDbConfig],
        synchronize: false,
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
    }),
    TypeOrmModule.forFeature([TenantMaster, TenantDbConfig], 'metadata'),
  ],
  providers: [
    {
      provide: METADATA_QUERY_FACTORY,
      useFactory: (ds: DataSource) => new QueryFactory(ds),
      inject: [getDataSourceToken('metadata')],
    },
  ],
  exports: [METADATA_QUERY_FACTORY, TypeOrmModule],
})
export class MetadataDatabaseModule {}
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/tenant/metadata/
git commit -m "feat(tenant): add MetadataDatabaseModule with separate QueryFactory"
```

---

### Task 4: TenantMetadataService

**Files:**
- Create: `src/infra/tenant/metadata/tenant-metadata.service.ts`

- [ ] **Step 1: Create TenantMetadataService**

```typescript
// src/infra/tenant/metadata/tenant-metadata.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { QueryFactory } from '@infra/database/query-factory/query-factory.service';
import { METADATA_QUERY_FACTORY } from './metadata-query-factory';
import { TenantDbConfig } from './entities/tenant-db-config.entity';
import { TenantMaster } from './entities/tenant-master.entity';

@Injectable()
export class TenantMetadataService {
  constructor(
    @Inject(METADATA_QUERY_FACTORY) private readonly qf: QueryFactory,
  ) {}

  /**
   * Get active DB config for a tenant (priority = 1, both master and config active).
   */
  async getTenantDbConfig(tenantId: string): Promise<TenantDbConfig | null> {
    return this.qf
      .select(TenantDbConfig, 'cfg')
      .innerJoin(TenantMaster, 'mst', 'cfg.tent_id = mst.tent_id')
      .andWhereStrict('mst.tentId = :tenantId', { tenantId })
      .andWhereStrict('mst.useFlg = true')
      .andWhereStrict('cfg.useFlg = true')
      .andWhereStrict('cfg.priority = 1')
      .getOne();
  }

  /**
   * Check if tenant exists and is active.
   */
  async isTenantActive(tenantId: string): Promise<boolean> {
    const count = await this.qf
      .select(TenantMaster, 'mst')
      .andWhereStrict('mst.tentId = :tenantId', { tenantId })
      .andWhereStrict('mst.useFlg = true')
      .getCount();
    return count > 0;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/tenant/metadata/tenant-metadata.service.ts
git commit -m "feat(tenant): add TenantMetadataService for querying tenant configs"
```

---

### Task 5: TenantDataSourceProperties

**Files:**
- Create: `src/infra/tenant/datasource/tenant-datasource.properties.ts`

- [ ] **Step 1: Create TenantDataSourceProperties**

```typescript
// src/infra/tenant/datasource/tenant-datasource.properties.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantDataSourceProperties {
  readonly poolMin: number;
  readonly poolMax: number;
  readonly poolIdleMs: number;
  readonly evictionMs: number;
  readonly connectTimeoutMs: number;

  constructor(config: ConfigService) {
    this.poolMin = config.get<number>('TENANT_POOL_MIN', 5);
    this.poolMax = config.get<number>('TENANT_POOL_MAX', 20);
    this.poolIdleMs = config.get<number>('TENANT_POOL_IDLE_MS', 600_000);
    this.evictionMs = config.get<number>('TENANT_POOL_EVICTION_MS', 3_600_000);
    this.connectTimeoutMs = config.get<number>('TENANT_POOL_CONNECT_TIMEOUT', 30_000);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/tenant/datasource/tenant-datasource.properties.ts
git commit -m "feat(tenant): add TenantDataSourceProperties config"
```

---

### Task 6: TenantDataSourceManager

**Files:**
- Create: `src/infra/tenant/datasource/tenant-datasource-manager.ts`

- [ ] **Step 1: Create TenantDataSourceManager**

```typescript
// src/infra/tenant/datasource/tenant-datasource-manager.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationShutdown,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantMetadataService } from '../metadata/tenant-metadata.service';
import { TenantDataSourceProperties } from './tenant-datasource.properties';
import { TenantDbConfig } from '../metadata/entities/tenant-db-config.entity';

interface CachedDataSource {
  dataSource: DataSource;
  lastAccess: number;
}

@Injectable()
export class TenantDataSourceManager implements OnApplicationShutdown {
  private readonly logger = new Logger(TenantDataSourceManager.name);
  private readonly cache = new Map<string, CachedDataSource>();
  private readonly pending = new Map<string, Promise<DataSource>>();
  private evictionTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly metadataService: TenantMetadataService,
    private readonly props: TenantDataSourceProperties,
  ) {
    // Start background eviction every 60s
    this.evictionTimer = setInterval(() => this.evictIdle(), 60_000);
  }

  /**
   * Get or create a DataSource for the given tenant (async).
   * Safe for concurrent calls — deduplicates initialization via pending map.
   */
  async getDataSource(tenantId: string): Promise<DataSource> {
    // Check cache first
    const cached = this.cache.get(tenantId);
    if (cached && cached.dataSource.isInitialized) {
      cached.lastAccess = Date.now();
      return cached.dataSource;
    }

    // Deduplicate concurrent init calls for same tenant
    const inflight = this.pending.get(tenantId);
    if (inflight) return inflight;

    const promise = this.initDataSource(tenantId);
    this.pending.set(tenantId, promise);
    try {
      return await promise;
    } finally {
      this.pending.delete(tenantId);
    }
  }

  /**
   * Get DataSource from cache only (sync). Returns null if not cached.
   * Used by the routing proxy — the interceptor guarantees warm cache.
   */
  getDataSourceSync(tenantId: string): DataSource | null {
    const cached = this.cache.get(tenantId);
    if (cached && cached.dataSource.isInitialized) {
      cached.lastAccess = Date.now();
      return cached.dataSource;
    }
    return null;
  }

  private async initDataSource(tenantId: string): Promise<DataSource> {
    const config = await this.metadataService.getTenantDbConfig(tenantId);
    if (!config) {
      throw new NotFoundException(`Tenant '${tenantId}' not found or inactive`);
    }

    const ds = this.createDataSource(config);
    try {
      await ds.initialize();
    } catch (err) {
      throw new ServiceUnavailableException(
        `Failed to connect to tenant '${tenantId}' database: ${(err as Error).message}`,
      );
    }

    this.cache.set(tenantId, { dataSource: ds, lastAccess: Date.now() });
    this.logger.log(`Initialized DataSource for tenant '${tenantId}'`);
    return ds;
  }

  private createDataSource(config: TenantDbConfig): DataSource {
    return new DataSource({
      type: 'postgres',
      host: config.dbHost,
      port: config.dbPort,
      database: config.dbName,
      username: config.dbUsername,
      password: config.dbPassword,
      entities: [], // Entities loaded via autoLoadEntities on default connection
      synchronize: false,
      connectTimeoutMS: this.props.connectTimeoutMs,
      extra: {
        min: this.props.poolMin,
        max: this.props.poolMax,
        idleTimeoutMillis: this.props.poolIdleMs,
      },
    });
  }

  private evictIdle(): void {
    const now = Date.now();
    for (const [tenantId, entry] of this.cache) {
      if (now - entry.lastAccess > this.props.evictionMs) {
        this.logger.log(`Evicting idle DataSource for tenant '${tenantId}'`);
        entry.dataSource.destroy().catch((err) => {
          this.logger.warn(`Error destroying DataSource for tenant '${tenantId}': ${err.message}`);
        });
        this.cache.delete(tenantId);
      }
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
    }

    const destroyPromises: Promise<void>[] = [];
    for (const [tenantId, entry] of this.cache) {
      this.logger.log(`Shutting down DataSource for tenant '${tenantId}'`);
      destroyPromises.push(entry.dataSource.destroy());
    }
    await Promise.allSettled(destroyPromises);
    this.cache.clear();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/tenant/datasource/tenant-datasource-manager.ts
git commit -m "feat(tenant): add TenantDataSourceManager with cache and eviction"
```

---

### Task 7: Tenant-Routing DataSource Proxy

**Files:**
- Create: `src/infra/tenant/datasource/tenant-routing-datasource.ts`

- [ ] **Step 1: Create routing proxy factory**

```typescript
// src/infra/tenant/datasource/tenant-routing-datasource.ts
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantContext } from '../tenant-context';
import { TenantDataSourceManager } from './tenant-datasource-manager';

const logger = new Logger('TenantRoutingDataSource');

/**
 * Creates a Proxy around the fallback DataSource that routes property access
 * to the correct tenant DataSource based on TenantContext.
 *
 * The TenantInterceptor guarantees the tenant DataSource is warm in cache
 * before any handler code runs, so getDataSourceSync will always return
 * a valid DataSource for authenticated requests.
 */
export function createRoutingDataSource(
  manager: TenantDataSourceManager,
  fallbackDs: DataSource,
): DataSource {
  return new Proxy(fallbackDs, {
    get(target, prop, receiver) {
      const tenantId = TenantContext.getTenantId();
      if (tenantId) {
        const tenantDs = manager.getDataSourceSync(tenantId);
        if (tenantDs) {
          return Reflect.get(tenantDs, prop, receiver);
        }
        // Cache miss should not happen if interceptor ran.
        // Fall through to default with warning.
        logger.warn(
          `Tenant '${tenantId}' DataSource not in cache — falling back to default. ` +
          `This indicates TenantInterceptor did not run.`,
        );
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/tenant/datasource/tenant-routing-datasource.ts
git commit -m "feat(tenant): add routing DataSource proxy"
```

---

### Task 8: TenantInterceptor

**Files:**
- Create: `src/infra/tenant/interceptors/tenant.interceptor.ts`

- [ ] **Step 1: Create TenantInterceptor**

```typescript
// src/infra/tenant/interceptors/tenant.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from '../tenant-context';
import { TenantDataSourceManager } from '../datasource/tenant-datasource-manager';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly manager: TenantDataSourceManager) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId: string | undefined = request.user?.tenantId;

    // Public routes (no user / no tenantId) — pass through without tenant context
    if (!tenantId) {
      return next.handle();
    }

    // Pre-warm the DataSource in cache (async)
    await this.manager.getDataSource(tenantId);

    // Wrap the handler execution in tenant context
    return new Observable((subscriber) => {
      TenantContext.run(tenantId, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infra/tenant/interceptors/tenant.interceptor.ts
git commit -m "feat(tenant): add TenantInterceptor for pre-warming and context"
```

---

### Task 9: TenantModule — Wire Everything Together

**Files:**
- Create: `src/infra/tenant/tenant.module.ts`
- Create: `src/infra/tenant/index.ts`

- [ ] **Step 1: Create TenantModule**

```typescript
// src/infra/tenant/tenant.module.ts
import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { MetadataDatabaseModule } from './metadata/metadata-database.module';
import { TenantMetadataService } from './metadata/tenant-metadata.service';
import { TenantDataSourceProperties } from './datasource/tenant-datasource.properties';
import { TenantDataSourceManager } from './datasource/tenant-datasource-manager';
import { createRoutingDataSource } from './datasource/tenant-routing-datasource';
import { TenantInterceptor } from './interceptors/tenant.interceptor';

@Global()
@Module({
  imports: [MetadataDatabaseModule],
  providers: [
    TenantDataSourceProperties,
    TenantMetadataService,
    TenantDataSourceManager,
    {
      provide: DataSource,
      useFactory: (
        manager: TenantDataSourceManager,
        metadataDs: DataSource,
      ) => createRoutingDataSource(manager, metadataDs),
      inject: [TenantDataSourceManager, getDataSourceToken('metadata')],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  exports: [DataSource, TenantDataSourceManager, TenantMetadataService],
})
export class TenantModule {}
```

- [ ] **Step 2: Create barrel export**

```typescript
// src/infra/tenant/index.ts
export { TenantModule } from './tenant.module';
export { TenantContext } from './tenant-context';
export { TenantDataSourceManager } from './datasource/tenant-datasource-manager';
export { TenantMetadataService } from './metadata/tenant-metadata.service';
```

- [ ] **Step 3: Commit**

```bash
git add src/infra/tenant/tenant.module.ts src/infra/tenant/index.ts
git commit -m "feat(tenant): add TenantModule wiring all components"
```

---

### Task 10: Update DatabaseModule

**Files:**
- Modify: `src/infra/database/database.module.ts`

- [ ] **Step 1: Replace PostgresConfigModule with TenantModule**

Replace the entire file content:

```typescript
// src/infra/database/database.module.ts
import { Global, Module } from '@nestjs/common';
import { TenantModule } from '@infra/tenant';
import { QueryFactoryModule } from './query-factory';

@Global()
@Module({
  imports: [
    TenantModule,
    QueryFactoryModule,
  ],
  exports: [TenantModule, QueryFactoryModule],
})
export class DatabaseModule {}
```

Key changes:
- Remove `PostgresConfigModule` import (single-DB config gone)
- Remove `TypeOrmModule.forFeature(ALL_ENTITIES)` (entities loaded via metadata connection and tenant connections)
- Import `TenantModule` which provides the routing `DataSource`
- Export `TenantModule` so the routing DataSource is available globally

- [ ] **Step 2: Verify the app compiles**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/backend && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 3: Commit**

```bash
git add src/infra/database/database.module.ts
git commit -m "feat(tenant): replace single-DB config with TenantModule in DatabaseModule"
```

---

### Task 11: Update Env Validation & .env Files

**Files:**
- Modify: `src/infra/config/env.validation.ts`
- Modify: `backend/.env`
- Modify: `backend/.env.example`

- [ ] **Step 1: Add metadata + tenant pool env vars to validation**

In `src/infra/config/env.validation.ts`, add after the existing DB fields (after line 30 `DB_NAME`):

```typescript
  // Metadata Database (tenant config storage)
  @IsString()
  METADATA_DB_HOST: string;

  @IsNumber()
  METADATA_DB_PORT: number;

  @IsString()
  METADATA_DB_USERNAME: string;

  @IsString()
  METADATA_DB_PASSWORD: string;

  @IsString()
  METADATA_DB_NAME: string;

  // Tenant pool settings (optional with defaults)
  @IsOptional()
  @IsNumber()
  TENANT_POOL_MIN: number = 5;

  @IsOptional()
  @IsNumber()
  TENANT_POOL_MAX: number = 20;

  @IsOptional()
  @IsNumber()
  TENANT_POOL_IDLE_MS: number = 600000;

  @IsOptional()
  @IsNumber()
  TENANT_POOL_EVICTION_MS: number = 3600000;

  @IsOptional()
  @IsNumber()
  TENANT_POOL_CONNECT_TIMEOUT: number = 30000;
```

Add `IsOptional` to the import from `class-validator`.

- [ ] **Step 2: Update .env**

Append to `backend/.env`:

```env

# ===============================
# METADATA DATABASE (Tenant Config Storage)
# ===============================
METADATA_DB_HOST=10.0.0.85
METADATA_DB_PORT=5432
METADATA_DB_USERNAME=postgres
METADATA_DB_PASSWORD=postgres
METADATA_DB_NAME=erp-tenant

# ===============================
# TENANT POOL SETTINGS
# ===============================
TENANT_POOL_MIN=5
TENANT_POOL_MAX=20
TENANT_POOL_IDLE_MS=600000
TENANT_POOL_EVICTION_MS=3600000
TENANT_POOL_CONNECT_TIMEOUT=30000
```

- [ ] **Step 3: Update .env.example with same structure**

Append the same block to `backend/.env.example` (with placeholder values).

- [ ] **Step 4: Commit**

```bash
git add src/infra/config/env.validation.ts backend/.env.example
git commit -m "feat(tenant): add metadata DB and tenant pool env vars"
```

Note: Do NOT commit `.env` (should be in .gitignore).

---

### Task 12: Update JWT — Add tenantId to Payload

**Files:**
- Modify: `src/apps/authentication/strategies/jwt.strategy.ts`
- Modify: `src/apps/authentication/dto/login-request.dto.ts`

- [ ] **Step 1: Add tenantId to JwtPayload interface**

In `src/apps/authentication/strategies/jwt.strategy.ts`, change the `JwtPayload` interface (lines 10-13):

```typescript
export interface JwtPayload {
  sub: string;
  username: string;
  tenantId: string;
}
```

- [ ] **Step 2: Update validate() to attach tenantId to returned user**

In `jwt.strategy.ts`, update the `validate` method to attach tenantId to the returned object. After line 42 (`return user;`), change to:

```typescript
    return { ...user, tenantId: payload.tenantId };
```

- [ ] **Step 3: Add tenantId to LoginRequestDto**

In `src/apps/authentication/dto/login-request.dto.ts`:

```typescript
import { IsString } from 'class-validator';

export class LoginRequestDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  tenantId: string;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/apps/authentication/strategies/jwt.strategy.ts src/apps/authentication/dto/login-request.dto.ts
git commit -m "feat(tenant): add tenantId to JWT payload and login request"
```

---

### Task 13: Update AuthService — Embed tenantId in JWT

**Files:**
- Modify: `src/apps/authentication/services/auth.service.ts`

- [ ] **Step 1: Update login() to use tenantId from request**

In `auth.service.ts`, update the `login` method (line 37-57). The `req.tenantId` now comes from `LoginRequestDto`. Change the method:

```typescript
  async login(req: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(req.username, req.password);
    if (!user) {
      throw new BizException('AUT000001', 'ERROR', 'Invalid credentials');
    }

    const tenantId = req.tenantId;

    const accessToken = this.generateAccessToken(user, tenantId);
    const refreshToken = this.generateRefreshToken(user, tenantId);

    // Register token in Redis cache if available
    if (this.authCacheService) {
      await this.authCacheService.registerUserToken(req.username, accessToken);
    }

    return {
      accessToken,
      accessExpireIn: this.accessExpireMs,
      refreshToken,
      refreshExpireIn: this.refreshExpireMs,
    };
  }
```

- [ ] **Step 2: Update generateAccessToken and generateRefreshToken to include tenantId**

Replace both private methods (lines 89-103):

```typescript
  private generateAccessToken(user: User, tenantId: string): string {
    const payload: JwtPayload = { sub: user.usrId, username: user.usrId, tenantId };
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: Math.floor(this.accessExpireMs / 1000),
    });
  }

  private generateRefreshToken(user: User, tenantId: string): string {
    const payload: JwtPayload = { sub: user.usrId, username: user.usrId, tenantId };
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: Math.floor(this.refreshExpireMs / 1000),
    });
  }
```

- [ ] **Step 3: Update refreshTokens to propagate tenantId**

In `refreshTokens` method (lines 65-87), update the return to pass tenantId:

```typescript
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponseDto> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new BizException('AUT000001', 'ERROR', 'Refresh token expired or invalid');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.useFlg) {
      throw new BizException('AUT000002', 'ERROR', 'User not found or inactive');
    }

    return {
      accessToken: this.generateAccessToken(user, payload.tenantId),
      accessExpireIn: this.accessExpireMs,
      refreshToken: this.generateRefreshToken(user, payload.tenantId),
      refreshExpireIn: this.refreshExpireMs,
    };
  }
```

- [ ] **Step 4: Commit**

```bash
git add src/apps/authentication/services/auth.service.ts
git commit -m "feat(tenant): embed tenantId in JWT token generation"
```

---

### Task 14: SQL Migration Script

**Files:**
- Create: `database/migrations/001_create_tenant_tables.sql`

- [ ] **Step 1: Create migration SQL**

```sql
-- database/migrations/001_create_tenant_tables.sql
-- Multi-tenant metadata tables
-- Run this against the METADATA database (METADATA_DB_NAME)

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

-- Example seed data (adjust to your environment):
-- INSERT INTO tenant.tent_mst (tent_id, tent_nm, cre_usr_id, upd_usr_id)
-- VALUES ('CO001', 'Demo Company', 'SYSTEM', 'SYSTEM');
--
-- INSERT INTO tenant.tent_db_cfg (tent_id, db_host, db_port, db_name, db_username, db_password, cre_usr_id, upd_usr_id)
-- VALUES ('CO001', 'localhost', 5432, 'erp-tenant-co001', 'postgres', 'postgres', 'SYSTEM', 'SYSTEM');
```

- [ ] **Step 2: Commit**

```bash
git add database/migrations/001_create_tenant_tables.sql
git commit -m "feat(tenant): add SQL migration for tenant metadata tables"
```

---

### Task 15: Final Compilation Check & Integration Verification

- [ ] **Step 1: Verify TypeScript compiles**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/backend && npx tsc --noEmit 2>&1 | head -50`
Expected: No errors

- [ ] **Step 2: Fix any compilation errors**

Address any TypeScript errors found in step 1.

- [ ] **Step 3: Verify NestJS boots (if DB available)**

Run: `cd /Users/admin/Desktop/Projects/Boilerplate/nuxtjs-nestjs/backend && timeout 10 npx nest start 2>&1 | tail -20`
Check for module initialization errors.

- [ ] **Step 4: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(tenant): resolve compilation issues from multi-tenant integration"
```
