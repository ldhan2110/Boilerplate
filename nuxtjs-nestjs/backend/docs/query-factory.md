# QueryFactory — Developer Guide

Your **one-stop shop** for all database operations. Reads, writes, transactions — all through one injectable service. No more `@InjectRepository`, no more `DataSource`, no more scattered `queryRunner` management.

## Setup — It's Already Done

`QueryFactory` is a **global module**. Just inject it:

```typescript
import { QueryFactory } from '@infra/database/query-factory';

@Injectable()
export class MyService {
  constructor(private readonly qf: QueryFactory) {}
}
```

That's it. No imports in your module file. No `TypeOrmModule.forFeature()`. No `@InjectRepository()`.

---

## The Big Picture

```
QueryFactory
├── READS (no transaction needed)
│   ├── qf.select(Entity, alias)     → QueryChain  (most queries)
│   ├── qf.raw(sql)                  → RawQueryChain (CTEs, complex SQL)
│   ├── qf.findOne(Entity, where)    → single entity or null
│   ├── qf.findOneOrFail(Entity, where) → single entity or throws
│   └── qf.genId(prefix, sequence)   → generate an ID outside transactions
│
└── WRITES (always use a transaction)
    └── qf.transaction(async (tx) => {
          tx.insert(Entity)     → InsertChain
          tx.update(Entity)     → UpdateChain
          tx.delete(Entity)     → DeleteChain
          tx.upsert(Entity)     → UpsertChain
          tx.insertMany(Entity) → same as insert, for bulk
          tx.updateMany(Entity) → same as update, for bulk
          tx.select(Entity, alias) → reads inside the transaction
          tx.findOne(Entity, where)
          tx.findOneOrFail(Entity, where)
          tx.genId(prefix, sequence)
        })
```

---

## Part 1: Reading Data

### Simple Find

```typescript
// Find one (returns null if not found)
const user = await this.qf.findOne(User, { usrId: 'USR001' });

// Find one (throws NotFoundException if not found)
const company = await this.qf.findOneOrFail(Company, { coId: 'CO001' });
```

### List with Search, Sort, and Pagination

This is the most common pattern. Chain methods together like building blocks:

```typescript
async getList(dto: SearchDto) {
  const [items, total] = await this.qf
    .select(Item, 'item')                                          // 1. Pick entity
    .andWhere('item.name ILIKE :name', {                           // 2. Filter
      name: dto.name ? `%${dto.name}%` : undefined                //    (skipped if undefined!)
    })
    .andWhere('item.status = :status', {
      status: dto.status || undefined
    })
    .orderByMany(dto.sorts, {                                      // 3. Sort
      name: 'item.name',
      createdAt: 'item.createdAt',
    }, { default: ['item.createdAt', 'DESC'] })
    .paginate(dto.pagination)                                      // 4. Paginate
    .getManyAndCount();                                             // 5. Execute

  return { items, total };
}
```

### The Magic: Auto-Skip WHERE

The killer feature — if any parameter is `null` or `undefined`, the **entire condition is skipped**. No more `if (value) { qb.andWhere(...) }` blocks.

```typescript
// OLD WAY (ugly):
if (dto.name) {
  qb.andWhere('u.name ILIKE :name', { name: `%${dto.name}%` });
}
if (dto.status) {
  qb.andWhere('u.status = :status', { status: dto.status });
}

// NEW WAY (clean):
chain
  .andWhere('u.name ILIKE :name', { name: dto.name ? `%${dto.name}%` : undefined })
  .andWhere('u.status = :status', { status: dto.status || undefined })
```

> **Important:** Only `null` and `undefined` trigger a skip. `false`, `0`, and `''` are real values and will NOT be skipped.

Need a condition that's ALWAYS applied? Use `whereStrict` / `andWhereStrict`:

```typescript
chain.whereStrict('u.deletedAt IS NULL');
chain.andWhereStrict('u.orgId = :orgId', { orgId }); // applied even if orgId is null
```

### Sort Whitelisting

Prevents SQL injection by only allowing known fields:

```typescript
chain.orderByMany(
  dto.sorts,                              // what the client sent
  {
    name: 'item.name',                    // allowed field → SQL column
    createdAt: 'item.createdAt',
  },
  { default: ['item.createdAt', 'DESC'] } // fallback if no valid sort
);
// Client sends { sortField: 'password' }? → silently ignored
```

### Joins

```typescript
chain.leftJoin('user.roles', 'role');
chain.leftJoinAndSelect('user.roles', 'role');
chain.innerJoin(Program, 'pgm', 'pgm.pgmId = auth.pgmId');
```

### Complex OR Conditions

Use the escape hatch:

```typescript
const chain = this.qf.select(Company, 'co');

if (searchText) {
  chain.getQueryBuilder().andWhere(
    '(co.coId ILIKE :term OR co.coNm ILIKE :term)',
    { term: `%${searchText}%` },
  );
}

const [data, total] = await chain
  .andWhere('co.useFlg = :useFlg', { useFlg: true })
  .paginate(dto.pagination)
  .getManyAndCount();
```

### Raw SQL (CTEs, Recursive Queries)

```typescript
const rows = await this.qf
  .raw<ProgramDto>(`
    WITH RECURSIVE Tree AS (
      SELECT pgm_id, pgm_nm, 1 AS level FROM com_pgm WHERE prnt_pgm_id IS NULL
      UNION ALL
      SELECT c.pgm_id, c.pgm_nm, p.level + 1
      FROM com_pgm c INNER JOIN Tree p ON c.prnt_pgm_id = p.pgm_id
    )
    SELECT * FROM Tree
  `)
  .andWhere('pgm_id = :id', { id: dto.pgmId || undefined })
  .orderBy('tree_path', 'ASC')
  .execute();
```

Your SQL gets wrapped in `SELECT * FROM (...) AS "__raw"`, so WHERE/ORDER/LIMIT work on top.

### Execution Methods

| Method | Returns | Use when |
|--------|---------|----------|
| `getMany()` | `T[]` | List of entities |
| `getManyAndCount()` | `[T[], number]` | List + total for pagination |
| `getOne()` | `T \| null` | Single entity |
| `getRawMany<R>()` | `R[]` | Custom SELECT with aliases |
| `getRawManyAndCount<R>()` | `[R[], number]` | Custom SELECT + total |
| `getRawOne<R>()` | `R \| null` | Single raw result |
| `getCount()` | `number` | Count only |

---

## Part 2: Writing Data

All writes go through **transactions**. This keeps your data safe — if anything fails, everything rolls back.

### Transaction Basics

```typescript
// Happy path → auto-commit
// Error thrown → auto-rollback
// Always → auto-release connection
const result = await this.qf.transaction(async (tx) => {
  // do stuff with tx...
  return someValue; // becomes the return value of transaction()
});
```

### INSERT

```typescript
await this.qf.transaction(async (tx) => {
  // Basic insert
  await tx.insert(Role)
    .values({ roleCd: 'ADMIN', roleNm: 'Administrator' })
    .execute();

  // With auto-generated ID (generates: "ROLE20260423xxxx")
  await tx.insert(Role)
    .values({ roleCd: 'ADMIN', roleNm: 'Admin' })
    .autoId('roleId', 'ROLE', 'seq_role')
    .execute();

  // Get back the saved entity
  const saved = await tx.insert(Role)
    .values({ roleCd: 'ADMIN' })
    .autoId('roleId', 'ROLE', 'seq_role')
    .returning<Role>()
    .execute();
  console.log(saved.roleId); // "ROLE202604230001"

  // Bulk insert
  await tx.insertMany(RoleAuth)
    .values([
      { roleId, pgmId: 'P1', permId: 'R' },
      { roleId, pgmId: 'P2', permId: 'W' },
    ])
    .execute();
});
```

### UPDATE

Two modes: **set** (you tell it exactly what to change) and **merge** (it fetches the old row and only overwrites non-null fields from your DTO).

```typescript
await this.qf.transaction(async (tx) => {
  // Mode 1: Explicit set — you control every field
  await tx.update(Role)
    .where({ roleId })
    .set({ roleNm: 'New Name', updatedBy: 'admin' })
    .execute();

  // Mode 2: Auto-merge — fetches existing, keeps null/undefined fields unchanged
  // Replaces those ugly 30-line "dto.field ?? existing.field" blocks!
  await tx.update(Company)
    .where({ coId: dto.coId })
    .merge(dto)  // only non-null/undefined fields overwrite
    .execute();

  // String WHERE for complex conditions
  await tx.update(User)
    .where('usrId = :id AND useFlg = :flg', { id: 'USR001', flg: true })
    .set({ usrNm: 'Updated' })
    .execute();
});
```

> **Safety:** Both `.set()` and `.merge()` require `.where()` first — calling `.execute()` without a WHERE throws an error.

### DELETE

```typescript
await this.qf.transaction(async (tx) => {
  await tx.delete(RoleAuth).where({ roleId }).execute();
});
```

> **Safety:** Calling `.execute()` without `.where()` throws — no accidental table wipes.

### UPSERT (Insert or Update)

For "insert if new, update if exists" patterns:

```typescript
await this.qf.transaction(async (tx) => {
  await tx.upsert(RoleAuth)
    .values(authList)
    .conflictOn(['roleId', 'pgmId', 'permId'])   // the unique key
    .mergeFields(['activeYn', 'updatedBy'])       // fields to update on conflict
    .execute();
});
```

### Reading Inside Transactions

When you need to read and write in the same transaction:

```typescript
await this.qf.transaction(async (tx) => {
  // Same QueryChain API as qf.select()
  const roles = await tx.select(Role, 'r')
    .where('r.useFlg = :useFlg', { useFlg: true })
    .getMany();

  // Simple lookups
  const role = await tx.findOne(Role, { roleId });
  const company = await tx.findOneOrFail(Company, { coId }); // throws if not found

  // Generate IDs inside the transaction
  const id = await tx.genId('ROLE', 'seq_role');
});
```

### Generate IDs

```typescript
// Outside a transaction (standalone):
const id = await this.qf.genId('CO', 'seq_co');
// → "CO202604230001"

// Inside a transaction (uses same connection):
await this.qf.transaction(async (tx) => {
  const id = await tx.genId('ROLE', 'seq_role');
});
```

---

## Part 3: Real-World Examples

### Create a Role with Auth Entries

```typescript
async insertRole(dto: RoleDto): Promise<SuccessDto> {
  // Validation outside the transaction
  const existing = await this.qf.findOne(Role, { roleCd: dto.roleCd });
  if (existing) throw new BadRequestException('Role code already exists');

  // All writes in one transaction
  await this.qf.transaction(async (tx) => {
    const roleId = await tx.genId('ROLE', 'seq_role');

    await tx.insert(Role).values({
      roleId,
      roleCd: dto.roleCd,
      roleNm: dto.roleNm,
      useFlg: dto.useFlg ?? true,
      createdBy: 'SYSTEM',
    }).execute();

    if (dto.roleAuthList?.length) {
      const items = dto.roleAuthList.map(item => ({
        roleId,
        pgmId: item.pgmId,
        permId: item.permId,
        activeYn: item.activeYn ?? true,
        createdBy: 'SYSTEM',
      }));
      await tx.insertMany(RoleAuth).values(items).execute();
    }
  });

  return SuccessDto.of(true);
}
```

### Update a Company (Partial Update)

```typescript
async updateCompany(dto: CompanyInfoDto): Promise<void> {
  const existing = await this.qf.findOneOrFail(Company, { coId: dto.coId });

  // Build partial update object
  const merged: Partial<Company> = {
    coNm: dto.coNm ?? existing.coNm,
    taxCd: dto.taxCd ?? existing.taxCd,
    useFlg: dto.useFlg ?? existing.useFlg,
    updatedBy: 'SYSTEM',
  };

  await this.qf.transaction(async (tx) => {
    await tx.update(Company)
      .where({ coId: dto.coId })
      .set(merged as any)
      .execute();
  });
}
```

### Delete + Replace Pattern

```typescript
async updateRole(dto: RoleDto): Promise<void> {
  await this.qf.transaction(async (tx) => {
    // Update the role itself
    await tx.update(Role).where({ roleId: dto.roleId }).set({
      roleCd: dto.roleCd,
      roleNm: dto.roleNm,
      updatedBy: 'SYSTEM',
    }).execute();

    // Delete old auth entries
    await tx.delete(RoleAuth).where({ roleId: dto.roleId }).execute();

    // Insert new ones
    if (dto.roleAuthList?.length) {
      const items = dto.roleAuthList.map(item => ({
        roleId: dto.roleId,
        pgmId: item.pgmId,
        permId: item.permId,
        activeYn: item.activeYn ?? true,
        createdBy: 'SYSTEM',
      }));
      await tx.insertMany(RoleAuth).values(items).execute();
    }
  });
}
```

---

## Part 4: Adding New Entities

When you create a new entity:

1. Create the entity file in `src/infra/database/entities/`
2. Add it to `ALL_ENTITIES` in `src/infra/database/query-factory/entity-registry.ts`

That's it. No module changes needed.

```typescript
// entity-registry.ts
export const ALL_ENTITIES = [
  Company,
  User,
  Program,
  Permission,
  Role,
  RoleAuth,
  MyNewEntity,  // ← just add it here
];
```

---

## Quick Reference

### QueryFactory Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `select(Entity, alias)` | `QueryChain` | Start a SELECT query |
| `raw(sql)` | `RawQueryChain` | Raw SQL (CTEs etc.) |
| `findOne(Entity, where)` | `T \| null` | Quick lookup |
| `findOneOrFail(Entity, where)` | `T` | Throws if not found |
| `genId(prefix, seq)` | `string` | Generate sequential ID |
| `transaction(fn)` | `R` | Run writes in a transaction |

### Inside Transactions (tx)

| Method | Returns | Description |
|--------|---------|-------------|
| `tx.insert(Entity)` | `InsertChain` | Start an INSERT |
| `tx.update(Entity)` | `UpdateChain` | Start an UPDATE |
| `tx.delete(Entity)` | `DeleteChain` | Start a DELETE |
| `tx.upsert(Entity)` | `UpsertChain` | Start an UPSERT |
| `tx.insertMany(Entity)` | `InsertChain` | Same as insert (for arrays) |
| `tx.select(Entity, alias)` | `QueryChain` | Read inside transaction |
| `tx.findOne(Entity, where)` | `T \| null` | Quick lookup in transaction |
| `tx.findOneOrFail(Entity, where)` | `T` | Throws if not found |
| `tx.genId(prefix, seq)` | `string` | Generate ID in transaction |

### Chain Methods

| InsertChain | UpdateChain | DeleteChain | UpsertChain |
|-------------|-------------|-------------|-------------|
| `.values(data)` | `.where(cond)` | `.where(cond)` | `.values(data)` |
| `.autoId(field, prefix, seq)` | `.set(data)` | `.execute()` | `.conflictOn(fields)` |
| `.returning<T>()` | `.merge(dto)` | | `.mergeFields(fields)` |
| `.execute()` | `.execute()` | | `.execute()` |

---

## Migration Checklist

Converting an existing service? Here's the step-by-step:

1. **Remove** `@InjectRepository(Entity)` from constructor
2. **Remove** `private readonly repo: Repository<Entity>` fields
3. **Remove** `private readonly dataSource: DataSource`
4. **Keep only** `private readonly qf: QueryFactory`
5. **Remove** `TypeOrmModule.forFeature([...])` from the module file
6. Replace `repo.findOne({ where })` → `this.qf.findOne(Entity, where)`
7. Replace `qf.from(repo, alias)` → `this.qf.select(Entity, alias)`
8. Replace `repo.create() + repo.save()` → `tx.insert(Entity).values().execute()`
9. Replace `generateId(dataSource, ...)` → `tx.genId(...)` or `this.qf.genId(...)`
10. Replace manual merge blocks → `tx.update(Entity).where().merge(dto).execute()`
11. Replace `dataSource.query('DELETE ...')` → `tx.delete(Entity).where().execute()`
12. Replace raw SQL upserts → `tx.upsert(Entity).values().conflictOn().mergeFields().execute()`
13. Wrap multi-step writes in `this.qf.transaction(async (tx) => { ... })`
