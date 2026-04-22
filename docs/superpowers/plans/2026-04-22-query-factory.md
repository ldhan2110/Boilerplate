# QueryFactory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an injectable QueryFactory service that wraps TypeORM's QueryBuilder with auto-skip WHERE params, built-in pagination, multi-sort whitelisting, and raw SQL support.

**Architecture:** Thin composition wrapper — QueryFactory (injectable) creates QueryChain (wraps SelectQueryBuilder) or RawQueryChain (builds parameterized SQL). All methods delegate to the underlying TypeORM QB or DataSource, adding only auto-skip, paginate, and orderByMany logic.

**Tech Stack:** NestJS 11, TypeORM 0.3.28, TypeScript 5.7, Jest 30, PostgreSQL

---

## File Map

```
nestjs/backend/src/infra/database/query-factory/
  types.ts                         # PaginationInput, SortInput interfaces
  query-chain.ts                   # QueryChain<T> — wraps SelectQueryBuilder
  raw-query-chain.ts               # RawQueryChain<T> — builds raw parameterized SQL
  query-factory.service.ts         # Injectable QueryFactory with select/from/raw/subQuery
  query-factory.module.ts          # @Global() NestJS module
  index.ts                         # barrel export

nestjs/backend/src/infra/database/query-factory/__tests__/
  query-chain.spec.ts              # Unit tests for QueryChain
  raw-query-chain.spec.ts          # Unit tests for RawQueryChain
  query-factory.service.spec.ts    # Unit tests for QueryFactory entry points

Modify:
  nestjs/backend/src/app.module.ts # Import QueryFactoryModule
```

---

### Task 1: Shared Types

**Files:**
- Create: `nestjs/backend/src/infra/database/query-factory/types.ts`

- [ ] **Step 1: Create types.ts**

```typescript
export interface PaginationInput {
  current?: number;
  pageSize?: number;
}

export interface SortInput {
  sortField: string;
  sortType?: 'ASC' | 'DESC';
}
```

- [ ] **Step 2: Commit**

```bash
cd nestjs/backend
git add src/infra/database/query-factory/types.ts
git commit -m "feat(query-factory): add shared types PaginationInput and SortInput"
```

---

### Task 2: QueryChain — Core with Auto-Skip WHERE

**Files:**
- Create: `nestjs/backend/src/infra/database/query-factory/query-chain.ts`
- Create: `nestjs/backend/src/infra/database/query-factory/__tests__/query-chain.spec.ts`

- [ ] **Step 1: Write failing tests for auto-skip WHERE and strict WHERE**

Create `nestjs/backend/src/infra/database/query-factory/__tests__/query-chain.spec.ts`:

```typescript
import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { QueryChain } from '../query-chain';

function mockQb(): jest.Mocked<SelectQueryBuilder<ObjectLiteral>> {
  return {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    andHaving: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    getOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
    getQuery: jest.fn().mockReturnValue('SELECT 1'),
    subQuery: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<SelectQueryBuilder<ObjectLiteral>>;
}

describe('QueryChain', () => {
  describe('auto-skip WHERE', () => {
    it('should skip .where() when param value is undefined', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.where('u.name = :name', { name: undefined });

      expect(qb.where).not.toHaveBeenCalled();
    });

    it('should skip .where() when param value is null', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.where('u.name = :name', { name: null });

      expect(qb.where).not.toHaveBeenCalled();
    });

    it('should apply .where() when param value is defined', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.where('u.name = :name', { name: 'John' });

      expect(qb.where).toHaveBeenCalledWith('u.name = :name', { name: 'John' });
    });

    it('should apply .where() when param value is falsy but not null/undefined', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.where('u.active = :active', { active: false });

      expect(qb.where).toHaveBeenCalledWith('u.active = :active', { active: false });
    });

    it('should apply .where() when param value is empty string', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.where('u.name = :name', { name: '' });

      expect(qb.where).toHaveBeenCalledWith('u.name = :name', { name: '' });
    });

    it('should apply .where() when param value is 0', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.where('u.count = :count', { count: 0 });

      expect(qb.where).toHaveBeenCalledWith('u.count = :count', { count: 0 });
    });

    it('should skip .andWhere() when param value is undefined', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.andWhere('u.email ILIKE :email', { email: undefined });

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('should apply .andWhere() when param value is defined', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.andWhere('u.email ILIKE :email', { email: '%test%' });

      expect(qb.andWhere).toHaveBeenCalledWith('u.email ILIKE :email', { email: '%test%' });
    });

    it('should skip .orWhere() when param value is undefined', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.orWhere('u.phone = :phone', { phone: undefined });

      expect(qb.orWhere).not.toHaveBeenCalled();
    });

    it('should skip when ANY param value is null/undefined in multi-param condition', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.where('u.name = :name AND u.age = :age', { name: 'John', age: undefined });

      expect(qb.where).not.toHaveBeenCalled();
    });

    it('should apply .where() without params (no param object)', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.where('u.active = true');

      expect(qb.where).toHaveBeenCalledWith('u.active = true', undefined);
    });
  });

  describe('whereStrict (no auto-skip)', () => {
    it('should apply .whereStrict() even when param is null', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.whereStrict('u.deleted IS :val', { val: null });

      expect(qb.where).toHaveBeenCalledWith('u.deleted IS :val', { val: null });
    });

    it('should apply .andWhereStrict() even when param is undefined', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.andWhereStrict('u.name = :name', { name: undefined });

      expect(qb.andWhere).toHaveBeenCalledWith('u.name = :name', { name: undefined });
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd nestjs/backend
npx jest src/infra/database/query-factory/__tests__/query-chain.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../query-chain'`

- [ ] **Step 3: Implement QueryChain — WHERE methods**

Create `nestjs/backend/src/infra/database/query-factory/query-chain.ts`:

```typescript
import {
  EntityTarget,
  ObjectLiteral,
  SelectQueryBuilder,
} from 'typeorm';
import { PaginationInput, SortInput } from './types.js';

export class QueryChain<T extends ObjectLiteral> {
  constructor(private readonly qb: SelectQueryBuilder<T>) {}

  // ─── helpers ──────────────────────────────────────────────

  private shouldSkip(params?: Record<string, any>): boolean {
    if (!params) return false;
    return Object.values(params).some((v) => v === null || v === undefined);
  }

  // ─── SELECT ───────────────────────────────────────────────

  select(columns: string[]): this {
    this.qb.select(columns);
    return this;
  }

  addSelect(columnOrSubQuery: string | QueryChain<any>, alias?: string): this {
    if (columnOrSubQuery instanceof QueryChain) {
      this.qb.addSelect(`(${columnOrSubQuery.getQuery()})`, alias!);
    } else {
      if (alias) {
        this.qb.addSelect(columnOrSubQuery, alias);
      } else {
        this.qb.addSelect(columnOrSubQuery);
      }
    }
    return this;
  }

  // ─── WHERE (auto-skip) ───────────────────────────────────

  where(condition: string, params?: Record<string, any>): this {
    if (this.shouldSkip(params)) return this;
    this.qb.where(condition, params);
    return this;
  }

  andWhere(condition: string, params?: Record<string, any>): this {
    if (this.shouldSkip(params)) return this;
    this.qb.andWhere(condition, params);
    return this;
  }

  orWhere(condition: string, params?: Record<string, any>): this {
    if (this.shouldSkip(params)) return this;
    this.qb.orWhere(condition, params);
    return this;
  }

  // ─── WHERE STRICT (no auto-skip) ─────────────────────────

  whereStrict(condition: string, params?: Record<string, any>): this {
    this.qb.where(condition, params);
    return this;
  }

  andWhereStrict(condition: string, params?: Record<string, any>): this {
    this.qb.andWhere(condition, params);
    return this;
  }

  // ─── JOINS (always strict) ───────────────────────────────

  leftJoin(
    relationOrEntity: string | EntityTarget<any> | QueryChain<any>,
    alias: string,
    on?: string,
    params?: Record<string, any>,
  ): this {
    if (relationOrEntity instanceof QueryChain) {
      this.qb.leftJoin(`(${relationOrEntity.getQuery()})`, alias, on!, params);
    } else {
      if (on) {
        this.qb.leftJoin(relationOrEntity as any, alias, on, params);
      } else {
        this.qb.leftJoin(relationOrEntity as string, alias);
      }
    }
    return this;
  }

  leftJoinAndSelect(
    relationOrEntity: string | EntityTarget<any>,
    alias: string,
    on?: string,
    params?: Record<string, any>,
  ): this {
    if (on) {
      this.qb.leftJoinAndSelect(relationOrEntity as any, alias, on, params);
    } else {
      this.qb.leftJoinAndSelect(relationOrEntity as string, alias);
    }
    return this;
  }

  innerJoin(
    relationOrEntity: string | EntityTarget<any>,
    alias: string,
    on?: string,
    params?: Record<string, any>,
  ): this {
    if (on) {
      this.qb.innerJoin(relationOrEntity as any, alias, on, params);
    } else {
      this.qb.innerJoin(relationOrEntity as string, alias);
    }
    return this;
  }

  // ─── GROUP BY / HAVING ───────────────────────────────────

  groupBy(column: string): this {
    this.qb.groupBy(column);
    return this;
  }

  addGroupBy(column: string): this {
    this.qb.addGroupBy(column);
    return this;
  }

  having(condition: string, params?: Record<string, any>): this {
    this.qb.having(condition, params);
    return this;
  }

  andHaving(condition: string, params?: Record<string, any>): this {
    this.qb.andHaving(condition, params);
    return this;
  }

  // ─── ORDER BY ────────────────────────────────────────────

  orderBy(column: string, order: 'ASC' | 'DESC' = 'ASC'): this {
    this.qb.orderBy(column, order);
    return this;
  }

  addOrderBy(column: string, order: 'ASC' | 'DESC' = 'ASC'): this {
    this.qb.addOrderBy(column, order);
    return this;
  }

  orderByMany(
    sorts: SortInput[] | undefined,
    whitelist: Record<string, string>,
    options?: { default?: [string, 'ASC' | 'DESC'] },
  ): this {
    const effective = sorts?.length ? sorts : [];

    if (!effective.length) {
      if (options?.default) {
        this.qb.orderBy(options.default[0], options.default[1]);
      }
      return this;
    }

    for (let i = 0; i < effective.length; i++) {
      const mapped = whitelist[effective[i].sortField];
      if (!mapped) continue;
      const order = effective[i].sortType ?? 'ASC';
      if (i === 0) {
        this.qb.orderBy(mapped, order);
      } else {
        this.qb.addOrderBy(mapped, order);
      }
    }

    return this;
  }

  // ─── PAGINATION ──────────────────────────────────────────

  paginate(pagination?: PaginationInput): this {
    if (!pagination) return this;
    const pageSize = pagination.pageSize ?? 10;
    const current = pagination.current ?? 1;
    this.qb.skip((current - 1) * pageSize).take(pageSize);
    return this;
  }

  skip(n: number): this {
    this.qb.skip(n);
    return this;
  }

  take(n: number): this {
    this.qb.take(n);
    return this;
  }

  // ─── EXECUTION ───────────────────────────────────────────

  getMany(): Promise<T[]> {
    return this.qb.getMany();
  }

  getManyAndCount(): Promise<[T[], number]> {
    return this.qb.getManyAndCount();
  }

  getOne(): Promise<T | null> {
    return this.qb.getOne();
  }

  getRawMany<R = any>(): Promise<R[]> {
    return this.qb.getRawMany<R>();
  }

  async getRawManyAndCount<R = any>(): Promise<[R[], number]> {
    const [raw, count] = await Promise.all([
      this.qb.getRawMany<R>(),
      this.qb.getCount(),
    ]);
    return [raw, count];
  }

  getRawOne<R = any>(): Promise<R | null> {
    return this.qb.getRawOne<R>();
  }

  getCount(): Promise<number> {
    return this.qb.getCount();
  }

  // ─── ESCAPE HATCH ────────────────────────────────────────

  getQueryBuilder(): SelectQueryBuilder<T> {
    return this.qb;
  }

  getQuery(): string {
    return this.qb.getQuery();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd nestjs/backend
npx jest src/infra/database/query-factory/__tests__/query-chain.spec.ts --no-coverage
```

Expected: All 12 tests PASS

- [ ] **Step 5: Commit**

```bash
cd nestjs/backend
git add src/infra/database/query-factory/query-chain.ts src/infra/database/query-factory/__tests__/query-chain.spec.ts
git commit -m "feat(query-factory): implement QueryChain with auto-skip WHERE and strict WHERE"
```

---

### Task 3: QueryChain — Pagination and OrderByMany Tests

**Files:**
- Modify: `nestjs/backend/src/infra/database/query-factory/__tests__/query-chain.spec.ts`

- [ ] **Step 1: Add failing tests for paginate and orderByMany**

Append to `query-chain.spec.ts`:

```typescript
  describe('paginate', () => {
    it('should apply skip/take for page 1', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.paginate({ current: 1, pageSize: 10 });

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('should apply skip/take for page 3', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.paginate({ current: 3, pageSize: 20 });

      expect(qb.skip).toHaveBeenCalledWith(40);
      expect(qb.take).toHaveBeenCalledWith(20);
    });

    it('should use defaults when pagination fields are missing', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.paginate({});

      expect(qb.skip).toHaveBeenCalledWith(0);
      expect(qb.take).toHaveBeenCalledWith(10);
    });

    it('should skip when pagination is undefined', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.paginate(undefined);

      expect(qb.skip).not.toHaveBeenCalled();
      expect(qb.take).not.toHaveBeenCalled();
    });
  });

  describe('orderByMany', () => {
    it('should apply single sort from whitelist', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.orderByMany(
        [{ sortField: 'name', sortType: 'DESC' }],
        { name: 'u.name', email: 'u.email' },
      );

      expect(qb.orderBy).toHaveBeenCalledWith('u.name', 'DESC');
    });

    it('should apply multiple sorts from whitelist', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.orderByMany(
        [
          { sortField: 'name', sortType: 'ASC' },
          { sortField: 'email', sortType: 'DESC' },
        ],
        { name: 'u.name', email: 'u.email' },
      );

      expect(qb.orderBy).toHaveBeenCalledWith('u.name', 'ASC');
      expect(qb.addOrderBy).toHaveBeenCalledWith('u.email', 'DESC');
    });

    it('should ignore sort fields not in whitelist', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.orderByMany(
        [{ sortField: 'password', sortType: 'ASC' }],
        { name: 'u.name' },
      );

      expect(qb.orderBy).not.toHaveBeenCalled();
    });

    it('should apply default sort when sorts array is empty', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.orderByMany(
        [],
        { name: 'u.name' },
        { default: ['u.createdAt', 'DESC'] },
      );

      expect(qb.orderBy).toHaveBeenCalledWith('u.createdAt', 'DESC');
    });

    it('should apply default sort when sorts is undefined', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.orderByMany(
        undefined,
        { name: 'u.name' },
        { default: ['u.createdAt', 'DESC'] },
      );

      expect(qb.orderBy).toHaveBeenCalledWith('u.createdAt', 'DESC');
    });

    it('should do nothing when sorts is empty and no default', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.orderByMany([], { name: 'u.name' });

      expect(qb.orderBy).not.toHaveBeenCalled();
    });

    it('should default sortType to ASC when not provided', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      chain.orderByMany(
        [{ sortField: 'name' }],
        { name: 'u.name' },
      );

      expect(qb.orderBy).toHaveBeenCalledWith('u.name', 'ASC');
    });
  });

  describe('execution methods', () => {
    it('getManyAndCount should delegate to qb', async () => {
      const qb = mockQb();
      qb.getManyAndCount.mockResolvedValue([[{ id: 1 } as any], 1]);
      const chain = new QueryChain(qb);

      const result = await chain.getManyAndCount();

      expect(result).toEqual([[{ id: 1 }], 1]);
    });

    it('getRawManyAndCount should run getRawMany and getCount in parallel', async () => {
      const qb = mockQb();
      qb.getRawMany.mockResolvedValue([{ id: 1 }]);
      qb.getCount.mockResolvedValue(5);
      const chain = new QueryChain(qb);

      const [data, count] = await chain.getRawManyAndCount();

      expect(data).toEqual([{ id: 1 }]);
      expect(count).toBe(5);
    });

    it('getOne should return null when no match', async () => {
      const qb = mockQb();
      qb.getOne.mockResolvedValue(null);
      const chain = new QueryChain(qb);

      const result = await chain.getOne();

      expect(result).toBeNull();
    });
  });

  describe('escape hatch', () => {
    it('getQueryBuilder should return the underlying QB', () => {
      const qb = mockQb();
      const chain = new QueryChain(qb);

      expect(chain.getQueryBuilder()).toBe(qb);
    });
  });
```

- [ ] **Step 2: Run tests to verify they pass**

```bash
cd nestjs/backend
npx jest src/infra/database/query-factory/__tests__/query-chain.spec.ts --no-coverage
```

Expected: All 22 tests PASS (12 existing + 10 new)

- [ ] **Step 3: Commit**

```bash
cd nestjs/backend
git add src/infra/database/query-factory/__tests__/query-chain.spec.ts
git commit -m "test(query-factory): add paginate, orderByMany, and execution tests for QueryChain"
```

---

### Task 4: RawQueryChain

**Files:**
- Create: `nestjs/backend/src/infra/database/query-factory/raw-query-chain.ts`
- Create: `nestjs/backend/src/infra/database/query-factory/__tests__/raw-query-chain.spec.ts`

- [ ] **Step 1: Write failing tests for RawQueryChain**

Create `nestjs/backend/src/infra/database/query-factory/__tests__/raw-query-chain.spec.ts`:

```typescript
import { DataSource } from 'typeorm';
import { RawQueryChain } from '../raw-query-chain';

function mockDataSource(): jest.Mocked<Pick<DataSource, 'query'>> {
  return {
    query: jest.fn().mockResolvedValue([]),
  };
}

describe('RawQueryChain', () => {
  describe('auto-skip WHERE', () => {
    it('should skip .where() when param value is undefined', async () => {
      const ds = mockDataSource();
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      chain.where('id = :id', { id: undefined });
      await chain.execute();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).not.toContain('WHERE');
    });

    it('should apply .where() when param value is defined', async () => {
      const ds = mockDataSource();
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      chain.where('id = :id', { id: 1 });
      await chain.execute();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).toContain('WHERE');
      expect(sql).toContain('id = $1');
      expect(ds.query.mock.calls[0][1]).toEqual([1]);
    });

    it('should chain .andWhere() with AND', async () => {
      const ds = mockDataSource();
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      chain
        .where('id = :id', { id: 1 })
        .andWhere('name = :name', { name: 'John' });
      await chain.execute();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).toContain('id = $1');
      expect(sql).toContain('AND name = $2');
      expect(ds.query.mock.calls[0][1]).toEqual([1, 'John']);
    });

    it('should skip .andWhere() when param undefined, keeping previous conditions', async () => {
      const ds = mockDataSource();
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      chain
        .where('id = :id', { id: 1 })
        .andWhere('name = :name', { name: undefined });
      await chain.execute();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).toContain('id = $1');
      expect(sql).not.toContain('name');
      expect(ds.query.mock.calls[0][1]).toEqual([1]);
    });

    it('should handle .orWhere()', async () => {
      const ds = mockDataSource();
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      chain
        .where('id = :id', { id: 1 })
        .orWhere('name = :name', { name: 'John' });
      await chain.execute();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).toContain('id = $1');
      expect(sql).toContain('OR name = $2');
    });
  });

  describe('orderBy', () => {
    it('should add ORDER BY clause', async () => {
      const ds = mockDataSource();
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      chain.orderBy('name', 'DESC');
      await chain.execute();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).toContain('ORDER BY name DESC');
    });

    it('should chain multiple order by with addOrderBy', async () => {
      const ds = mockDataSource();
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      chain.orderBy('name', 'DESC').addOrderBy('id', 'ASC');
      await chain.execute();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).toContain('ORDER BY name DESC, id ASC');
    });
  });

  describe('paginate', () => {
    it('should add LIMIT and OFFSET', async () => {
      const ds = mockDataSource();
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      chain.paginate({ current: 2, pageSize: 10 });
      await chain.execute();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).toContain('LIMIT 10');
      expect(sql).toContain('OFFSET 10');
    });

    it('should not add LIMIT/OFFSET when pagination is undefined', async () => {
      const ds = mockDataSource();
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      chain.paginate(undefined);
      await chain.execute();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).not.toContain('LIMIT');
      expect(sql).not.toContain('OFFSET');
    });
  });

  describe('executeAndCount', () => {
    it('should wrap SQL with COUNT(*) OVER() and extract total', async () => {
      const ds = mockDataSource();
      ds.query.mockResolvedValue([
        { id: 1, name: 'John', __total: '5' },
        { id: 2, name: 'Jane', __total: '5' },
      ]);
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      const [data, total] = await chain.executeAndCount();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).toContain('COUNT(*) OVER() AS "__total"');
      expect(total).toBe(5);
      expect(data[0]).not.toHaveProperty('__total');
      expect(data).toEqual([
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
      ]);
    });

    it('should return 0 total when no rows', async () => {
      const ds = mockDataSource();
      ds.query.mockResolvedValue([]);
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      const [data, total] = await chain.executeAndCount();

      expect(data).toEqual([]);
      expect(total).toBe(0);
    });
  });

  describe('executeOne', () => {
    it('should return first row or null', async () => {
      const ds = mockDataSource();
      ds.query.mockResolvedValue([{ id: 1 }]);
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      const result = await chain.executeOne();

      expect(result).toEqual({ id: 1 });
    });

    it('should return null when no rows', async () => {
      const ds = mockDataSource();
      ds.query.mockResolvedValue([]);
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      const result = await chain.executeOne();

      expect(result).toBeNull();
    });
  });

  describe('named param to positional conversion', () => {
    it('should convert :param to $N correctly', async () => {
      const ds = mockDataSource();
      const chain = new RawQueryChain(ds as any, 'SELECT * FROM users');

      chain
        .where('id = :id', { id: 1 })
        .andWhere('status = :status', { status: 'active' })
        .andWhere('age > :age', { age: 25 });
      await chain.execute();

      const sql = ds.query.mock.calls[0][0] as string;
      expect(sql).toContain('id = $1');
      expect(sql).toContain('status = $2');
      expect(sql).toContain('age > $3');
      expect(ds.query.mock.calls[0][1]).toEqual([1, 'active', 25]);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd nestjs/backend
npx jest src/infra/database/query-factory/__tests__/raw-query-chain.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../raw-query-chain'`

- [ ] **Step 3: Implement RawQueryChain**

Create `nestjs/backend/src/infra/database/query-factory/raw-query-chain.ts`:

```typescript
import { DataSource } from 'typeorm';
import { PaginationInput, SortInput } from './types.js';

interface WhereClause {
  condition: string;
  params: Record<string, any>;
  connector: 'WHERE' | 'AND' | 'OR';
}

export class RawQueryChain<T = any> {
  private readonly clauses: WhereClause[] = [];
  private readonly orderClauses: string[] = [];
  private paginationInput?: PaginationInput;

  constructor(
    private readonly dataSource: DataSource,
    private readonly baseSql: string,
  ) {}

  // ─── helpers ──────────────────────────────────────────────

  private shouldSkip(params?: Record<string, any>): boolean {
    if (!params) return false;
    return Object.values(params).some((v) => v === null || v === undefined);
  }

  private buildSql(withCount: boolean): { sql: string; params: any[] } {
    const params: any[] = [];
    let paramIdx = 1;

    // Build WHERE clause with positional params
    const whereParts: string[] = [];
    for (const clause of this.clauses) {
      let condition = clause.condition;
      for (const [key, value] of Object.entries(clause.params)) {
        condition = condition.replace(new RegExp(`:${key}\\b`, 'g'), `$${paramIdx}`);
        params.push(value);
        paramIdx++;
      }
      if (whereParts.length === 0) {
        whereParts.push(`WHERE ${condition}`);
      } else {
        whereParts.push(`${clause.connector} ${condition}`);
      }
    }

    // Build ORDER BY
    const orderByClause = this.orderClauses.length
      ? `ORDER BY ${this.orderClauses.join(', ')}`
      : '';

    // Build LIMIT/OFFSET
    let limitClause = '';
    if (this.paginationInput) {
      const pageSize = this.paginationInput.pageSize ?? 10;
      const current = this.paginationInput.current ?? 1;
      const offset = (current - 1) * pageSize;
      limitClause = `LIMIT ${pageSize} OFFSET ${offset}`;
    }

    // Assemble
    const selectExpr = withCount ? '*, COUNT(*) OVER() AS "__total"' : '*';
    const parts = [
      `SELECT ${selectExpr}`,
      `FROM (${this.baseSql}) AS "__raw"`,
      whereParts.join(' '),
      orderByClause,
      limitClause,
    ].filter(Boolean);

    return { sql: parts.join('\n'), params };
  }

  // ─── WHERE (auto-skip) ───────────────────────────────────

  where(condition: string, params?: Record<string, any>): this {
    if (this.shouldSkip(params)) return this;
    this.clauses.push({ condition, params: params ?? {}, connector: 'WHERE' });
    return this;
  }

  andWhere(condition: string, params?: Record<string, any>): this {
    if (this.shouldSkip(params)) return this;
    this.clauses.push({ condition, params: params ?? {}, connector: 'AND' });
    return this;
  }

  orWhere(condition: string, params?: Record<string, any>): this {
    if (this.shouldSkip(params)) return this;
    this.clauses.push({ condition, params: params ?? {}, connector: 'OR' });
    return this;
  }

  // ─── ORDER BY ────────────────────────────────────────────

  orderBy(column: string, order: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderClauses.length = 0;
    this.orderClauses.push(`${column} ${order}`);
    return this;
  }

  addOrderBy(column: string, order: 'ASC' | 'DESC' = 'ASC'): this {
    this.orderClauses.push(`${column} ${order}`);
    return this;
  }

  orderByMany(
    sorts: SortInput[] | undefined,
    whitelist: Record<string, string>,
    options?: { default?: [string, 'ASC' | 'DESC'] },
  ): this {
    const effective = sorts?.length ? sorts : [];

    if (!effective.length) {
      if (options?.default) {
        this.orderBy(options.default[0], options.default[1]);
      }
      return this;
    }

    this.orderClauses.length = 0;
    for (const s of effective) {
      const mapped = whitelist[s.sortField];
      if (!mapped) continue;
      this.orderClauses.push(`${mapped} ${s.sortType ?? 'ASC'}`);
    }

    return this;
  }

  // ─── PAGINATION ──────────────────────────────────────────

  paginate(pagination?: PaginationInput): this {
    if (!pagination) return this;
    this.paginationInput = pagination;
    return this;
  }

  // ─── EXECUTION ───────────────────────────────────────────

  async execute(): Promise<T[]> {
    const { sql, params } = this.buildSql(false);
    return this.dataSource.query(sql, params);
  }

  async executeAndCount(): Promise<[T[], number]> {
    const { sql, params } = this.buildSql(true);
    const rows: (T & { __total?: string })[] = await this.dataSource.query(sql, params);

    if (rows.length === 0) return [[], 0];

    const total = parseInt(String(rows[0].__total ?? '0'), 10);
    const data = rows.map((row) => {
      const { __total, ...rest } = row as any;
      return rest as T;
    });

    return [data, total];
  }

  async executeOne(): Promise<T | null> {
    const rows = await this.execute();
    return rows.length > 0 ? rows[0] : null;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd nestjs/backend
npx jest src/infra/database/query-factory/__tests__/raw-query-chain.spec.ts --no-coverage
```

Expected: All 14 tests PASS

- [ ] **Step 5: Commit**

```bash
cd nestjs/backend
git add src/infra/database/query-factory/raw-query-chain.ts src/infra/database/query-factory/__tests__/raw-query-chain.spec.ts
git commit -m "feat(query-factory): implement RawQueryChain with param conversion and executeAndCount"
```

---

### Task 5: QueryFactory Service

**Files:**
- Create: `nestjs/backend/src/infra/database/query-factory/query-factory.service.ts`
- Create: `nestjs/backend/src/infra/database/query-factory/__tests__/query-factory.service.spec.ts`

- [ ] **Step 1: Write failing tests for QueryFactory**

Create `nestjs/backend/src/infra/database/query-factory/__tests__/query-factory.service.spec.ts`:

```typescript
import { DataSource, Repository, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { QueryFactory } from '../query-factory.service';
import { QueryChain } from '../query-chain';
import { RawQueryChain } from '../raw-query-chain';

function mockSelectQb(): jest.Mocked<SelectQueryBuilder<ObjectLiteral>> {
  return {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getQuery: jest.fn().mockReturnValue('SELECT 1'),
    subQuery: jest.fn().mockReturnThis(),
  } as unknown as jest.Mocked<SelectQueryBuilder<ObjectLiteral>>;
}

function mockDataSource(): jest.Mocked<Pick<DataSource, 'createQueryBuilder' | 'query'>> {
  const qb = mockSelectQb();
  return {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
    query: jest.fn().mockResolvedValue([]),
  };
}

function mockRepository(): jest.Mocked<Pick<Repository<ObjectLiteral>, 'createQueryBuilder'>> {
  const qb = mockSelectQb();
  return {
    createQueryBuilder: jest.fn().mockReturnValue(qb),
  };
}

// Dummy entity class for tests
class TestEntity {}

describe('QueryFactory', () => {
  it('select() should return a QueryChain', () => {
    const ds = mockDataSource();
    const factory = new QueryFactory(ds as any);

    const chain = factory.select(TestEntity, 'test');

    expect(chain).toBeInstanceOf(QueryChain);
    expect(ds.createQueryBuilder).toHaveBeenCalledWith(TestEntity, 'test');
  });

  it('select() with columns should call .select() on the QB', () => {
    const ds = mockDataSource();
    const factory = new QueryFactory(ds as any);
    const qb = ds.createQueryBuilder() as jest.Mocked<SelectQueryBuilder<ObjectLiteral>>;
    ds.createQueryBuilder.mockReturnValue(qb);

    factory.select(TestEntity, 'test', ['test.id', 'test.name']);

    expect(qb.select).toHaveBeenCalledWith(['test.id', 'test.name']);
  });

  it('from() should return a QueryChain using repository QB', () => {
    const ds = mockDataSource();
    const repo = mockRepository();
    const factory = new QueryFactory(ds as any);

    const chain = factory.from(repo as any, 'test');

    expect(chain).toBeInstanceOf(QueryChain);
    expect(repo.createQueryBuilder).toHaveBeenCalledWith('test');
  });

  it('raw() should return a RawQueryChain', () => {
    const ds = mockDataSource();
    const factory = new QueryFactory(ds as any);

    const chain = factory.raw('SELECT * FROM users');

    expect(chain).toBeInstanceOf(RawQueryChain);
  });

  it('subQuery() should return a QueryChain', () => {
    const ds = mockDataSource();
    const factory = new QueryFactory(ds as any);

    const chain = factory.subQuery(TestEntity, 'sub');

    expect(chain).toBeInstanceOf(QueryChain);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd nestjs/backend
npx jest src/infra/database/query-factory/__tests__/query-factory.service.spec.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../query-factory.service'`

- [ ] **Step 3: Implement QueryFactory service**

Create `nestjs/backend/src/infra/database/query-factory/query-factory.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import {
  DataSource,
  EntityTarget,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { QueryChain } from './query-chain.js';
import { RawQueryChain } from './raw-query-chain.js';

@Injectable()
export class QueryFactory {
  constructor(private readonly dataSource: DataSource) {}

  select<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T> {
    const qb = this.dataSource.createQueryBuilder(entity, alias);
    if (columns) {
      qb.select(columns);
    }
    return new QueryChain<T>(qb);
  }

  from<T extends ObjectLiteral>(
    repository: Repository<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T> {
    const qb = repository.createQueryBuilder(alias);
    if (columns) {
      qb.select(columns);
    }
    return new QueryChain<T>(qb);
  }

  raw<T = any>(sql: string): RawQueryChain<T> {
    return new RawQueryChain<T>(this.dataSource, sql);
  }

  subQuery<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T> {
    const qb = this.dataSource.createQueryBuilder(entity, alias);
    if (columns) {
      qb.select(columns);
    }
    return new QueryChain<T>(qb);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd nestjs/backend
npx jest src/infra/database/query-factory/__tests__/query-factory.service.spec.ts --no-coverage
```

Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
cd nestjs/backend
git add src/infra/database/query-factory/query-factory.service.ts src/infra/database/query-factory/__tests__/query-factory.service.spec.ts
git commit -m "feat(query-factory): implement injectable QueryFactory service with select/from/raw/subQuery"
```

---

### Task 6: Module, Barrel Export, and App Registration

**Files:**
- Create: `nestjs/backend/src/infra/database/query-factory/query-factory.module.ts`
- Create: `nestjs/backend/src/infra/database/query-factory/index.ts`
- Modify: `nestjs/backend/src/app.module.ts`

- [ ] **Step 1: Create the NestJS module**

Create `nestjs/backend/src/infra/database/query-factory/query-factory.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { QueryFactory } from './query-factory.service.js';

@Global()
@Module({
  providers: [QueryFactory],
  exports: [QueryFactory],
})
export class QueryFactoryModule {}
```

- [ ] **Step 2: Create barrel export**

Create `nestjs/backend/src/infra/database/query-factory/index.ts`:

```typescript
export { QueryFactory } from './query-factory.service.js';
export { QueryChain } from './query-chain.js';
export { RawQueryChain } from './raw-query-chain.js';
export { QueryFactoryModule } from './query-factory.module.js';
export type { PaginationInput, SortInput } from './types.js';
```

- [ ] **Step 3: Register QueryFactoryModule in AppModule**

In `nestjs/backend/src/app.module.ts`, add the import:

```typescript
import { QueryFactoryModule } from '@infra/database/query-factory/query-factory.module.js';
```

And add `QueryFactoryModule` to the `imports` array:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    DatabaseModule,
    QueryFactoryModule,
    AuthModule,
    AdministrationModule,
  ],
  // ...
})
export class AppModule {}
```

- [ ] **Step 4: Verify the app compiles**

```bash
cd nestjs/backend
npx nest build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Run all query-factory tests**

```bash
cd nestjs/backend
npx jest src/infra/database/query-factory/ --no-coverage
```

Expected: All tests PASS (query-chain: 22, raw-query-chain: 14, query-factory.service: 5 = 41 total)

- [ ] **Step 6: Commit**

```bash
cd nestjs/backend
git add src/infra/database/query-factory/query-factory.module.ts src/infra/database/query-factory/index.ts src/app.module.ts
git commit -m "feat(query-factory): add global module, barrel export, register in AppModule"
```

---

## Summary

| Task | What | Files | Tests |
|------|------|-------|-------|
| 1 | Shared types | `types.ts` | — |
| 2 | QueryChain core (auto-skip WHERE, strict WHERE, joins, group by, select, execution, escape hatch) | `query-chain.ts` | 12 |
| 3 | QueryChain paginate + orderByMany | `query-chain.spec.ts` | 10 |
| 4 | RawQueryChain (param conversion, WHERE, ORDER BY, paginate, execute/executeAndCount) | `raw-query-chain.ts` | 14 |
| 5 | QueryFactory injectable service (select, from, raw, subQuery) | `query-factory.service.ts` | 5 |
| 6 | Module registration + barrel export + app wiring | `module.ts`, `index.ts`, `app.module.ts` | build check |

**Total: 6 tasks, ~41 unit tests**
