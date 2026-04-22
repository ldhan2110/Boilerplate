# QueryFactory — Unified TypeORM Query Layer for NestJS

**Date:** 2026-04-22
**Status:** Approved
**Approach:** Thin wrapper over TypeORM QueryBuilder (Approach 1)

## Problem

In a large NestJS + TypeORM team, each developer writes queries in their own style:

- `dataSource.createQueryBuilder()` with raw selects and `getRawMany`
- `repository.createQueryBuilder()` with entity selects and `getManyAndCount`
- Raw `dataSource.query()` with manual param indexing for complex joins/CTEs
- Mixed approaches in the same service file

Every service repeats: pagination math, conditional WHERE blocks, sort field whitelisting, ILIKE wrapping — all slightly differently. No enforced format or convention.

## Solution

An injectable `QueryFactory` service that wraps TypeORM's `SelectQueryBuilder` with a thin, SQL-like fluent API. It adds auto-skip for null/undefined WHERE params, built-in pagination, multi-sort with whitelisting, and a raw SQL chain for CTEs — while keeping the full power of QueryBuilder accessible via escape hatch.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| API style | SQL-like fluent builder | Natural for developers, zero new syntax to learn |
| Wrapper approach | Thin composition over QB | Smallest codebase (~200-300 lines), version-safe |
| Auto-skip scope | `.where()` / `.andWhere()` / `.orWhere()` only | JOINs stay strict — auto-skipping ON conditions changes query meaning |
| Return type | `[T[], number]` tuple | Matches TypeORM's `getManyAndCount()`, services wrap into their own DTO shape |
| Registration | `@Global()` NestJS module, injectable service | Consistent with existing patterns, testable, single DataSource |
| Location | `src/infra/database/query-factory/` | Alongside entities and base entity |

## File Structure

```
src/infra/database/query-factory/
  index.ts                    # barrel export
  query-factory.service.ts    # injectable QueryFactory
  query-chain.ts              # QueryChain<T> — fluent wrapper over SelectQueryBuilder
  raw-query-chain.ts          # RawQueryChain<T> — for .raw() SQL
  query-factory.module.ts     # NestJS module (global)
  types.ts                    # PaginationInput, SortInput interfaces
```

## Shared Types

```typescript
// types.ts

export interface PaginationInput {
  current?: number;    // page number, 1-based (default: 1)
  pageSize?: number;   // items per page (default: 10)
}

export interface SortInput {
  sortField: string;
  sortType?: 'ASC' | 'DESC';  // default: 'ASC'
}
```

These match the existing DTO shapes used across the codebase (`dto.pagination`, `dto.sort`, `dto.sorts`). No frontend or controller changes needed.

## QueryFactory Service — Entry Points

```typescript
@Injectable()
export class QueryFactory {
  constructor(private readonly dataSource: DataSource) {}

  // From entity class — uses dataSource.createQueryBuilder()
  select<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T>

  // From existing repository — uses repository.createQueryBuilder()
  from<T extends ObjectLiteral>(
    repository: Repository<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T>

  // Raw SQL — for CTEs, complex unions, anything beyond QueryBuilder
  raw<T = any>(sql: string): RawQueryChain<T>

  // Subquery helper — returns a QueryChain usable inside .where() or .addSelect()
  subQuery<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T>
}
```

**When to use which:**

| Entry Point | Use Case |
|---|---|
| `.select(Entity, alias)` | Most queries |
| `.from(repository, alias)` | When you need repository context (soft deletes, subscribers) |
| `.raw(sql)` | CTEs, recursive queries, complex unions |
| `.subQuery(Entity, alias)` | Nested inside WHERE or SELECT |

## QueryChain API Surface

Every method returns `this` for chaining.

```typescript
class QueryChain<T extends ObjectLiteral> {
  // ─── SELECT ─────────────────────────────────────────────
  select(columns: string[]): this
  addSelect(column: string, alias?: string): this
  addSelect(subQuery: QueryChain<any>, alias: string): this

  // ─── WHERE (auto-skip when any param value is null/undefined) ─
  where(condition: string, params?: Record<string, any>): this
  andWhere(condition: string, params?: Record<string, any>): this
  orWhere(condition: string, params?: Record<string, any>): this

  // ─── WHERE STRICT (no auto-skip, for explicit NULL checks) ─
  whereStrict(condition: string, params?: Record<string, any>): this
  andWhereStrict(condition: string, params?: Record<string, any>): this

  // ─── JOINS (always strict, no auto-skip) ────────────────
  leftJoin(relation: string, alias: string): this
  leftJoin(entity: EntityTarget<any>, alias: string, on: string, params?: Record<string, any>): this
  leftJoin(subQuery: QueryChain<any>, alias: string, on: string, params?: Record<string, any>): this
  leftJoinAndSelect(relation: string, alias: string): this
  leftJoinAndSelect(entity: EntityTarget<any>, alias: string, on: string, params?: Record<string, any>): this
  innerJoin(relation: string, alias: string): this
  innerJoin(entity: EntityTarget<any>, alias: string, on: string, params?: Record<string, any>): this

  // ─── GROUP BY / HAVING ──────────────────────────────────
  groupBy(column: string): this
  addGroupBy(column: string): this
  having(condition: string, params?: Record<string, any>): this
  andHaving(condition: string, params?: Record<string, any>): this

  // ─── ORDER BY ───────────────────────────────────────────
  orderBy(column: string, order?: 'ASC' | 'DESC'): this
  addOrderBy(column: string, order?: 'ASC' | 'DESC'): this
  orderByMany(
    sorts: SortInput[] | undefined,
    whitelist: Record<string, string>,
    options?: { default?: [string, 'ASC' | 'DESC'] },
  ): this

  // ─── PAGINATION ─────────────────────────────────────────
  paginate(pagination?: PaginationInput): this
  skip(n: number): this
  take(n: number): this

  // ─── EXECUTION ──────────────────────────────────────────
  getMany(): Promise<T[]>
  getManyAndCount(): Promise<[T[], number]>
  getOne(): Promise<T | null>
  getRawMany<R = any>(): Promise<R[]>
  getRawManyAndCount<R = any>(): Promise<[R[], number]>
  getRawOne<R = any>(): Promise<R | null>
  getCount(): Promise<number>

  // ─── ESCAPE HATCH ───────────────────────────────────────
  getQueryBuilder(): SelectQueryBuilder<T>
  getQuery(): string   // for subQuery usage
}
```

### Auto-Skip Internals

```typescript
// If params object has ANY value that is null or undefined, skip the entire condition
andWhere(condition: string, params?: Record<string, any>): this {
  if (params && Object.values(params).some(v => v === null || v === undefined)) {
    return this;
  }
  this.qb.andWhere(condition, params);
  return this;
}
```

### Paginate Internals

```typescript
paginate(pagination?: PaginationInput): this {
  if (!pagination) return this;
  const pageSize = pagination.pageSize ?? 10;
  const current = pagination.current ?? 1;
  this.qb.skip((current - 1) * pageSize).take(pageSize);
  return this;
}
```

### orderByMany Internals

```typescript
orderByMany(
  sorts: SortInput[] | undefined,
  whitelist: Record<string, string>,
  options?: { default?: [string, 'ASC' | 'DESC'] },
): this {
  const effectiveSorts = sorts?.length ? sorts : [];

  if (!effectiveSorts.length && options?.default) {
    this.qb.orderBy(options.default[0], options.default[1]);
    return this;
  }

  for (let i = 0; i < effectiveSorts.length; i++) {
    const mapped = whitelist[effectiveSorts[i].sortField];
    if (!mapped) continue; // ignore unknown fields (prevents SQL injection)
    const order = effectiveSorts[i].sortType ?? 'ASC';
    if (i === 0) this.qb.orderBy(mapped, order);
    else this.qb.addOrderBy(mapped, order);
  }

  return this;
}
```

## RawQueryChain API Surface

For `.raw()` queries — builds parameterized SQL, runs via `dataSource.query()`.

```typescript
class RawQueryChain<T = any> {
  // ─── WHERE (auto-skip same as QueryChain) ───────────────
  where(condition: string, params?: Record<string, any>): this
  andWhere(condition: string, params?: Record<string, any>): this
  orWhere(condition: string, params?: Record<string, any>): this

  // ─── ORDER BY ───────────────────────────────────────────
  orderBy(column: string, order?: 'ASC' | 'DESC'): this
  addOrderBy(column: string, order?: 'ASC' | 'DESC'): this
  orderByMany(
    sorts: SortInput[] | undefined,
    whitelist: Record<string, string>,
    options?: { default?: [string, 'ASC' | 'DESC'] },
  ): this

  // ─── PAGINATION ─────────────────────────────────────────
  paginate(pagination?: PaginationInput): this

  // ─── EXECUTION ──────────────────────────────────────────
  execute(): Promise<T[]>
  executeAndCount(): Promise<[T[], number]>
  executeOne(): Promise<T | null>
}
```

### How RawQueryChain Builds SQL

Given:
```typescript
qf.raw<ProgramDto>(`WITH RECURSIVE ... SELECT * FROM ProgramTree`)
  .where('pgm_id = :pgmId', { pgmId: 'PGM001' })
  .andWhere('use_flg = :useFlg', { useFlg: true })
  .orderBy('tree_path', 'ASC')
  .paginate({ current: 1, pageSize: 20 })
  .executeAndCount();
```

Produces:
```sql
SELECT *, COUNT(*) OVER() AS "__total"
FROM (
  WITH RECURSIVE ... SELECT * FROM ProgramTree
) AS "__raw"
WHERE pgm_id = $1 AND use_flg = $2
ORDER BY tree_path ASC
LIMIT 20 OFFSET 0

-- params: ['PGM001', true]
```

Named `:param` placeholders are converted to positional `$1, $2, $3` for PostgreSQL native execution. The `__total` column is extracted and stripped from results before returning the `[rows, total]` tuple.

## Module Registration

```typescript
// query-factory.module.ts
@Global()
@Module({
  providers: [QueryFactory],
  exports: [QueryFactory],
})
export class QueryFactoryModule {}
```

```typescript
// app.module.ts — import once
@Module({
  imports: [
    TypeOrmModule.forRoot({ ... }),
    QueryFactoryModule,
    // ...
  ],
})
export class AppModule {}
```

## Before & After Examples

### Users — getListUserInfo (40 lines to 12 lines)

**Before:**
```typescript
async getListUserInfo(dto: SearchUserDto): Promise<UserInfoListDto> {
  const { usrId, usrNm, pagination } = dto;
  const pageSize = pagination?.pageSize ?? 10;
  const current = pagination?.current ?? 1;

  const qb = this.dataSource
    .createQueryBuilder(User, 'u')
    .select([
      'u.usrId AS "usrId"', 'u.usrNm AS "usrNm"', 'u.usrEml AS "usrEml"',
      // ... 11 more columns
    ])
    .where('1=1');

  if (usrId) {
    qb.andWhere('u.usrId ILIKE :usrId', { usrId: `%${usrId}%` });
  }
  if (usrNm) {
    qb.andWhere('u.usrNm ILIKE :usrNm', { usrNm: `%${usrNm}%` });
  }

  const total = await qb.getCount();
  const raw = await qb
    .offset((current - 1) * pageSize)
    .limit(pageSize)
    .getRawMany<UserInfoDto>();

  return { userInfo: raw, total };
}
```

**After:**
```typescript
async getListUserInfo(dto: SearchUserDto): Promise<UserInfoListDto> {
  const [userInfo, total] = await this.qf
    .select(User, 'u', [
      'u.usrId AS "usrId"', 'u.usrNm AS "usrNm"', 'u.usrEml AS "usrEml"',
      'u.usrPhn AS "usrPhn"', 'u.usrAddr AS "usrAddr"', 'u.usrDesc AS "usrDesc"',
      'u.usrFileId AS "usrFileId"', 'u.roleId AS "roleId"', 'u.roleNm AS "roleNm"',
      'u.langVal AS "langVal"', 'u.sysModVal AS "sysModVal"', 'u.dtFmtVal AS "dtFmtVal"',
      'u.sysColrVal AS "sysColrVal"', 'u.useFlg AS "useFlg"',
    ])
    .where('u.usrId ILIKE :usrId', { usrId: dto.usrId ? `%${dto.usrId}%` : undefined })
    .andWhere('u.usrNm ILIKE :usrNm', { usrNm: dto.usrNm ? `%${dto.usrNm}%` : undefined })
    .paginate(dto.pagination)
    .getRawManyAndCount<UserInfoDto>();

  return { userInfo, total };
}
```

### Roles — getRoleList (50 lines to 15 lines)

**After:**
```typescript
async getRoleList(dto: SearchRoleDto): Promise<RoleListDto> {
  const [roles, total] = await this.qf
    .from(this.roleRepository, 'role')
    .select(['role.roleId', 'role.roleCd', 'role.roleNm', 'role.roleDesc',
             'role.useFlg', 'role.createdBy', 'role.updatedBy'])
    .where('role.roleCd = :roleCd', { roleCd: dto.roleCd })
    .andWhere('role.roleNm ILIKE :roleNm', { roleNm: dto.roleNm ? `%${dto.roleNm}%` : undefined })
    .andWhere('role.useFlg = :useFlg', { useFlg: dto.useFlg })
    .orderByMany(dto.sorts, {
      updatedAt: 'role.updatedAt',
      createdAt: 'role.createdAt',
      roleCd: 'role.roleCd',
      roleNm: 'role.roleNm',
    }, { default: ['role.updatedAt', 'DESC'] })
    .paginate(dto.pagination)
    .getManyAndCount();

  return { roleList: roles.map(r => ({ ...r })), total };
}
```

### Programs — getProgramList CTE (50+ lines to 15 lines)

**After:**
```typescript
async getProgramList(dto: SearchProgramDto): Promise<ProgramListDto> {
  const [programs, total] = await this.qf
    .raw<ProgramDto>(`
      WITH RECURSIVE ProgramTree AS (
        SELECT pgm_id, pgm_cd, pgm_nm, pgm_tp_cd, prnt_pgm_id,
               dsp_order, pgm_rmk, use_flg, upd_dt, upd_usr_id,
               1 AS level,
               CAST(pgm_id AS text) AS tree_key,
               LPAD(CAST(dsp_order AS TEXT), 3, '0') AS tree_path
        FROM com_pgm WHERE prnt_pgm_id IS NULL
        UNION ALL
        SELECT c.pgm_id, c.pgm_cd, c.pgm_nm, c.pgm_tp_cd, c.prnt_pgm_id,
               c.dsp_order, c.pgm_rmk, c.use_flg, c.upd_dt, c.upd_usr_id,
               p.level + 1,
               p.tree_key || '-' || CAST(c.pgm_id AS text),
               p.tree_path || '-' || LPAD(CAST(c.dsp_order AS TEXT), 3, '0')
        FROM com_pgm c INNER JOIN ProgramTree p ON c.prnt_pgm_id = p.pgm_id
      )
      SELECT * FROM ProgramTree
    `)
    .where('pgm_id = :pgmId', { pgmId: dto.pgmId })
    .andWhere('pgm_cd ILIKE :pgmCd', { pgmCd: dto.pgmCd ? `%${dto.pgmCd}%` : undefined })
    .andWhere('pgm_nm ILIKE :pgmNm', { pgmNm: dto.pgmNm ? `%${dto.pgmNm}%` : undefined })
    .andWhere('pgm_tp_cd = :pgmTpCd', { pgmTpCd: dto.pgmTpCd })
    .andWhere('use_flg = :useFlg', { useFlg: dto.useFlg })
    .orderBy('tree_path', 'ASC')
    .paginate(dto.pagination)
    .executeAndCount();

  return ProgramListDto.of(programs, total);
}
```

### Complex Join with Subquery + Grouping

```typescript
const [data, total] = await this.qf
  .select(RoleAuth, 'auth', [
    'role.roleCd',
    'pgm.pgmCd',
    'pgm.pgmTpCd',
    'COUNT(perm.permId) AS "permCount"',
  ])
  .leftJoin(Role, 'role', 'role.roleId = auth.roleId')
  .leftJoin(Program, 'pgm', 'pgm.pgmId = auth.pgmId')
  .leftJoin(Permission, 'perm', 'perm.permId = auth.permId')
  .where('auth.activeYn = :active', { active: true })
  .andWhere('role.roleId IN ' +
    this.qf.subQuery(Role, 'r', ['r.roleId'])
      .where('r.roleCd = :roleCd', { roleCd: dto.roleCd })
      .getQuery()
  )
  .groupBy('role.roleCd')
  .addGroupBy('pgm.pgmCd')
  .addGroupBy('pgm.pgmTpCd')
  .having('COUNT(perm.permId) > :minPerms', { minPerms: 1 })
  .orderBy('role.roleCd', 'ASC')
  .paginate(dto.pagination)
  .getRawManyAndCount();
```

## Testing Strategy

- **Unit tests:** Mock `DataSource` and `SelectQueryBuilder`, verify that auto-skip, paginate, orderByMany produce correct QB calls
- **Integration tests:** Run against a test PostgreSQL database, verify actual SQL output for QueryChain and RawQueryChain
- **Edge cases:** Empty pagination, empty sorts, all WHERE params undefined (should return all rows), mixed null/defined params

## Scope

**In scope:**
- QueryFactory service, QueryChain, RawQueryChain
- QueryFactoryModule (global)
- Shared types (PaginationInput, SortInput)
- Unit tests

**Out of scope:**
- Migrating existing services (separate task after factory is built)
- Query caching or logging (can be added later)
- Frontend or DTO changes (none needed)
