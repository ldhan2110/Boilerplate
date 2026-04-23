# QueryFactory CRUD & Transaction Extension — Design Spec

## Problem

QueryFactory currently covers **reads only** (SELECT). All write operations (INSERT, UPDATE, DELETE) are scattered across services using a mix of:

- Direct `repository.create()` + `.save()` with manual ID generation
- Raw SQL strings for upserts and multi-table mutations
- Manual `QueryRunner` transaction management with inconsistent cleanup
- 30+ line partial-update merge blocks (`dto.field ?? existing.field`)
- Per-module `TypeOrmModule.forFeature([...])` and `@InjectRepository()` boilerplate

This creates inconsistency across the team and makes it easy to forget transaction wrapping, ID generation, or proper error handling.

## Solution

Extend QueryFactory to be the **single entry point for all database operations** — reads, writes, and transactions. Introduce mutation chains (`InsertChain`, `UpdateChain`, `DeleteChain`, `UpsertChain`) that mirror the existing fluent read-chain patterns. Eliminate per-module entity registration by registering all entities globally in `DatabaseModule`.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| ID generation | Optional — `autoId()` or pass your own | Max flexibility; not all entities use sequence-based IDs |
| Transaction API | Explicit callback `qf.transaction(fn)` | Developer composes steps manually; factory handles commit/rollback/release |
| Partial updates | Both `.set()` and `.merge()` | `.set()` for explicit control, `.merge()` for auto-fetch + shallow-merge convenience |
| Bulk operations | First-class `insertMany/updateMany/deleteMany` | Common pattern across services; eliminates loops of individual saves |
| Upsert | Chain method with `.conflictOn()` + `.mergeFields()` | Replaces raw SQL upserts with type-safe API |
| Entity registration | Global — all entities registered once in `DatabaseModule` | Eliminates `TypeOrmModule.forFeature()` and `@InjectRepository()` from feature modules |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   QueryFactory                       │
│   (Global injectable — single DI dependency)         │
├─────────────────────────────────────────────────────┤
│                                                      │
│  READS (existing)            WRITES (new)            │
│  ├─ select(Entity, alias)    ├─ transaction(fn)      │
│  ├─ from(repo, alias)        │   tx returns:         │
│  ├─ raw<T>(sql)              │   ├─ tx.insert()      │
│  └─ subQuery()               │   ├─ tx.update()      │
│                              │   ├─ tx.delete()      │
│  STANDALONE (new)            │   ├─ tx.upsert()      │
│  ├─ findOne(Entity, where)   │   ├─ tx.insertMany()  │
│  ├─ findOneOrFail(Entity)    │   ├─ tx.updateMany()  │
│  └─ genId(prefix, seq)       │   ├─ tx.deleteMany()  │
│                              │   ├─ tx.select()      │
│                              │   ├─ tx.findOne()     │
│                              │   └─ tx.genId()       │
└─────────────────────────────────────────────────────┘
```

### File Structure

```
backend/src/infra/database/query-factory/
├── index.ts                    # re-exports
├── query-factory.module.ts     # global module (unchanged)
├── query-factory.service.ts    # extended with transaction(), findOne(), genId()
├── query-chain.ts              # existing read chain (unchanged)
├── raw-query-chain.ts          # existing raw chain (unchanged)
├── transaction-context.ts      # NEW — wraps QueryRunner, exposes mutation + read methods
├── chains/
│   ├── insert-chain.ts         # NEW — fluent insert builder
│   ├── update-chain.ts         # NEW — fluent update builder with .merge()
│   ├── delete-chain.ts         # NEW — fluent delete builder
│   └── upsert-chain.ts        # NEW — fluent upsert builder
├── types.ts                    # extended with mutation types
└── entity-registry.ts          # NEW — collects all entity classes for global registration
```

## API Specification

### QueryFactory (extended)

```typescript
class QueryFactory {
  // ─── Existing (unchanged) ──────────────────────────
  select<T>(entity, alias, columns?): QueryChain<T>;
  from<T>(repository, alias, columns?): QueryChain<T>;
  raw<T>(sql): RawQueryChain<T>;
  subQuery<T>(entity, alias, columns?): QueryChain<T>;

  // ─── New: Transaction ──────────────────────────────
  transaction<R>(fn: (tx: TransactionContext) => Promise<R>): Promise<R>;

  // ─── New: Standalone helpers ───────────────────────
  findOne<T>(entity: EntityTarget<T>, where: FindOptionsWhere<T>): Promise<T | null>;
  findOneOrFail<T>(entity: EntityTarget<T>, where: FindOptionsWhere<T>): Promise<T>;
  genId(prefix: string, sequence: string): Promise<string>;
}
```

### TransactionContext

Wraps a `QueryRunner`. Auto-commits on success, auto-rollbacks on throw, auto-releases in finally.

```typescript
class TransactionContext {
  // ─── Reads (on transaction connection) ─────────────
  select<T>(entity, alias, columns?): QueryChain<T>;
  findOne<T>(entity, where): Promise<T | null>;
  findOneOrFail<T>(entity, where): Promise<T>;
  raw<T>(sql): RawQueryChain<T>;

  // ─── ID generation ────────────────────────────────
  genId(prefix: string, sequence: string): Promise<string>;

  // ─── Mutations ────────────────────────────────────
  insert<T>(entity: EntityTarget<T>): InsertChain<T>;
  insertMany<T>(entity: EntityTarget<T>): InsertChain<T>;
  update<T>(entity: EntityTarget<T>): UpdateChain<T>;
  updateMany<T>(entity: EntityTarget<T>): UpdateChain<T>;
  delete<T>(entity: EntityTarget<T>): DeleteChain<T>;
  upsert<T>(entity: EntityTarget<T>): UpsertChain<T>;
}
```

**Return type:** `transaction<R>()` is generic — the return type of the callback becomes the return type of the outer call.

```typescript
const roleId = await this.qf.transaction(async (tx) => {
  // ... mutations ...
  return roleId; // string
});
// roleId is typed as string
```

### InsertChain

```typescript
class InsertChain<T> {
  values(data: DeepPartial<T> | DeepPartial<T>[]): this;
  autoId(field: keyof T & string, prefix: string, sequence: string): this;
  returning<R = T>(): ReturningInsertChain<R>;
  execute(): Promise<void>;
}

class ReturningInsertChain<R> {
  execute(): Promise<R>;
}
```

Usage:

```typescript
// Basic
await tx.insert(Role).values({ roleCd, roleNm }).execute();

// With auto-ID
await tx.insert(Role)
  .values({ roleCd, roleNm })
  .autoId('roleId', 'ROLE', 'seq_role')
  .execute();

// With returning
const { roleId } = await tx.insert(Role)
  .values({ roleCd, roleNm })
  .autoId('roleId', 'ROLE', 'seq_role')
  .returning<{ roleId: string }>()
  .execute();

// Bulk
await tx.insertMany(RoleAuth).values([
  { roleId, pgmId: 'P1', permId: 'R' },
  { roleId, pgmId: 'P2', permId: 'W' },
]).execute();
```

### UpdateChain

```typescript
class UpdateChain<T> {
  where(condition: FindOptionsWhere<T>): this;
  where(condition: string, params: Record<string, unknown>): this;
  set(data: DeepPartial<T>): this;
  merge(dto: DeepPartial<T>): this; // auto-fetches existing, shallow-merges non-null/undefined
  execute(): Promise<void>;
}
```

**`.merge()` semantics:**
1. Fetches the existing row using the WHERE condition
2. Throws `NotFoundException` if not found
3. For each field in `dto`: if the value is not `null` and not `undefined`, use it; otherwise keep the existing value
4. Saves the merged result

Usage:

```typescript
// Explicit set
await tx.update(Company).where({ coId }).set({ coNm: 'New' }).execute();

// Auto-merge (replaces 30-line ?? blocks)
await tx.update(Company).where({ coId }).merge(dto).execute();

// String where
await tx.update(Company)
  .where('coId = :coId AND useFlg = :useFlg', { coId, useFlg: true })
  .set(data)
  .execute();

// Bulk update
await tx.updateMany(User)
  .where({ usrId: In(ids) })
  .set({ usrPwd: hashed })
  .execute();
```

### DeleteChain

```typescript
class DeleteChain<T> {
  where(condition: FindOptionsWhere<T>): this;
  where(condition: string, params: Record<string, unknown>): this;
  execute(): Promise<void>;
}
```

Usage:

```typescript
await tx.delete(RoleAuth).where({ roleId }).execute();
```

### UpsertChain

```typescript
class UpsertChain<T> {
  values(data: DeepPartial<T> | DeepPartial<T>[]): this;
  conflictOn(fields: (keyof T & string)[]): this;
  mergeFields(fields: (keyof T & string)[]): this;
  execute(): Promise<void>;
}
```

Usage:

```typescript
await tx.upsert(RoleAuth)
  .values(authList)
  .conflictOn(['roleId', 'pgmId', 'permId'])
  .mergeFields(['activeYn', 'updatedBy'])
  .execute();
```

### Transaction Lifecycle

```typescript
async transaction<R>(fn: (tx: TransactionContext) => Promise<R>): Promise<R> {
  const qr = this.dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
    const tx = new TransactionContext(qr, this.dataSource);
    const result = await fn(tx);
    await qr.commitTransaction();
    return result;
  } catch (error) {
    await qr.rollbackTransaction();
    throw error;
  } finally {
    await qr.release();
  }
}
```

**Rules:**
- Throw anything inside the callback = rollback + error propagates
- Return normally = commit + result returned to caller
- QueryRunner always released in `finally`

## Global Entity Registration

### entity-registry.ts

```typescript
import { Company } from '@infra/database/entities/administration/company.entity';
import { User } from '@infra/database/entities/administration/user.entity';
import { Role, RoleAuth } from '@infra/database/entities/administration';
import { Program } from '@infra/database/entities/administration/program.entity';
import { Permission } from '@infra/database/entities/administration/permission.entity';

export const ALL_ENTITIES = [
  Company,
  User,
  Role,
  RoleAuth,
  Program,
  Permission,
];
```

### DatabaseModule (updated)

```typescript
@Global()
@Module({
  imports: [
    PostgresConfigModule,
    QueryFactoryModule,
    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  exports: [QueryFactoryModule, TypeOrmModule],
})
export class DatabaseModule {}
```

### Feature modules (simplified)

```typescript
// BEFORE
@Module({
  imports: [TypeOrmModule.forFeature([Role, RoleAuth])],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}

// AFTER
@Module({
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
```

### Services (simplified)

```typescript
// BEFORE
@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(RoleAuth) private readonly roleAuthRepository: Repository<RoleAuth>,
    private readonly dataSource: DataSource,
    private readonly qf: QueryFactory,
  ) {}
}

// AFTER
@Injectable()
export class RolesService {
  constructor(private readonly qf: QueryFactory) {}
}
```

## Before/After Examples

### Create Role with Auth List

```typescript
// BEFORE (30 lines, no transaction wrapping)
async insertRole(dto: RoleDto): Promise<SuccessDto> {
  const existing = await this.roleRepository.findOne({ where: { roleCd } });
  if (existing) throw new BadRequestException('ADM000010');

  const roleId = await generateId(this.dataSource, 'ROLE', 'seq_role');
  const role = this.roleRepository.create({ roleId, roleCd, roleNm, ... });
  await this.roleRepository.save(role);

  if (roleAuthList?.length) {
    for (const item of roleAuthList) {
      const auth = this.roleAuthRepository.create({ roleId, ... });
      await this.roleAuthRepository.save(auth);
    }
  }
  return SuccessDto.of(true);
}

// AFTER (12 lines, auto-transactional)
async insertRole(dto: RoleDto): Promise<SuccessDto> {
  const existing = await this.qf.findOne(Role, { roleCd: dto.roleCd });
  if (existing) throw new BadRequestException('ADM000010');

  await this.qf.transaction(async (tx) => {
    await tx.insert(Role)
      .values({ roleCd: dto.roleCd, roleNm: dto.roleNm, roleDesc: dto.roleDesc, useFlg: dto.useFlg ?? true, createdBy: dto.createdBy ?? 'SYSTEM', updatedBy: dto.updatedBy ?? 'SYSTEM' })
      .autoId('roleId', 'ROLE', 'seq_role')
      .execute();

    if (dto.roleAuthList?.length) {
      await tx.insertMany(RoleAuth).values(dto.roleAuthList).execute();
    }
  });
  return SuccessDto.of(true);
}
```

### Update Role with Auth Replacement

```typescript
// BEFORE (20 lines, mixed raw SQL + repository)
async updateRole(dto: RoleDto): Promise<SuccessDto> {
  await this.roleRepository.update({ roleId }, { roleCd, roleNm, ... });
  await this.dataSource.query('DELETE FROM adm_role_auth WHERE role_id = $1', [roleId]);
  if (roleAuthList?.length) {
    for (const item of roleAuthList) {
      await this.dataSource.query(
        'INSERT INTO adm_role_auth (...) VALUES (...) ON CONFLICT (...) DO UPDATE SET ...',
        [roleId, item.pgmId, ...]
      );
    }
  }
  return SuccessDto.of(true);
}

// AFTER (10 lines, fully typed, auto-transactional)
async updateRole(dto: RoleDto): Promise<SuccessDto> {
  await this.qf.transaction(async (tx) => {
    await tx.update(Role).where({ roleId: dto.roleId }).set({
      roleCd: dto.roleCd, roleNm: dto.roleNm, roleDesc: dto.roleDesc,
      useFlg: dto.useFlg, updatedBy: dto.updatedBy ?? 'SYSTEM',
    }).execute();

    await tx.delete(RoleAuth).where({ roleId: dto.roleId }).execute();

    if (dto.roleAuthList?.length) {
      await tx.upsert(RoleAuth)
        .values(dto.roleAuthList.map(a => ({ roleId: dto.roleId, pgmId: a.pgmId, permId: a.permId, activeYn: a.activeYn ?? true, updatedBy: dto.updatedBy ?? 'SYSTEM' })))
        .conflictOn(['roleId', 'pgmId', 'permId'])
        .mergeFields(['activeYn', 'updatedBy'])
        .execute();
    }
  });
  return SuccessDto.of(true);
}
```

### Update Company (partial merge)

```typescript
// BEFORE (40 lines of ?? merging)
async updateCompany(dto: CompanyInfoDto): Promise<void> {
  const existing = await this.companyRepository.findOne({ where: { coId: dto.coId } });
  if (!existing) throw new NotFoundException('ADM000104');
  const merged = {
    coNm: dto.coNm ?? existing.coNm,
    coTpCd: dto.coTpCd ?? existing.coTpCd,
    // ... 25 more lines ...
  };
  await this.companyRepository.save({ ...existing, ...merged });
}

// AFTER (5 lines)
async updateCompany(dto: CompanyInfoDto): Promise<void> {
  await this.qf.transaction(async (tx) => {
    await tx.update(Company).where({ coId: dto.coId }).merge(dto).execute();
  });
}
```

## Scope Boundaries

**In scope:**
- `TransactionContext` with commit/rollback/release lifecycle
- `InsertChain`, `UpdateChain`, `DeleteChain`, `UpsertChain`
- `.merge()` auto-fetch + shallow-merge for partial updates
- `.autoId()` optional ID generation
- `.returning()` for getting generated values back
- Global entity registration in `DatabaseModule`
- `findOne()`, `findOneOrFail()`, `genId()` on QueryFactory directly
- Update existing developer guide (`docs/query-factory.md`)

**Out of scope:**
- Soft delete chains (use existing TypeORM `@DeleteDateColumn` + repository)
- Nested transactions / savepoints
- Batch size chunking for very large insertMany (can add later)
- Migration of existing services (separate task)
