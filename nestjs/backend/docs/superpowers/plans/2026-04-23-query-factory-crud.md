# QueryFactory CRUD & Transaction Extension — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend QueryFactory with mutation chains (insert/update/delete/upsert), transaction context, auto-merge partial updates, and global entity registration so services only inject `QueryFactory`.

**Architecture:** New `TransactionContext` wraps TypeORM `QueryRunner` and exposes fluent chain classes (`InsertChain`, `UpdateChain`, `DeleteChain`, `UpsertChain`) alongside the existing read `QueryChain`. All entities registered globally in `DatabaseModule`; feature modules drop `TypeOrmModule.forFeature()` and `@InjectRepository()`.

**Tech Stack:** NestJS 11, TypeORM 0.3, PostgreSQL, Jest 30, ts-jest

---

## File Map

```
backend/src/infra/database/query-factory/
├── index.ts                        # MODIFY — add re-exports for new classes
├── query-factory.module.ts         # UNCHANGED
├── query-factory.service.ts        # MODIFY — add transaction(), findOne(), findOneOrFail(), genId()
├── query-chain.ts                  # UNCHANGED
├── raw-query-chain.ts              # UNCHANGED
├── types.ts                        # MODIFY — add MutationWhereCondition type
├── transaction-context.ts          # CREATE — wraps QueryRunner, exposes mutations + reads
├── chains/
│   ├── insert-chain.ts             # CREATE — fluent insert/insertMany builder
│   ├── update-chain.ts             # CREATE — fluent update builder with .merge()
│   ├── delete-chain.ts             # CREATE — fluent delete builder
│   └── upsert-chain.ts            # CREATE — fluent upsert builder
├── entity-registry.ts              # CREATE — ALL_ENTITIES array

backend/src/infra/database/
├── database.module.ts              # MODIFY — add TypeOrmModule.forFeature(ALL_ENTITIES), make @Global

backend/src/infra/database/query-factory/__tests__/
├── insert-chain.spec.ts            # CREATE — InsertChain unit tests
├── update-chain.spec.ts            # CREATE — UpdateChain unit tests
├── delete-chain.spec.ts            # CREATE — DeleteChain unit tests
├── upsert-chain.spec.ts            # CREATE — UpsertChain unit tests
├── transaction-context.spec.ts     # CREATE — TransactionContext unit tests
├── query-factory-crud.spec.ts      # CREATE — QueryFactory new method tests
```

---

### Task 1: Types & Entity Registry

**Files:**
- Modify: `backend/src/infra/database/query-factory/types.ts`
- Create: `backend/src/infra/database/query-factory/entity-registry.ts`

- [ ] **Step 1: Add mutation types to types.ts**

Open `backend/src/infra/database/query-factory/types.ts` and add the mutation-related types after the existing `SortInput`:

```typescript
import { FindOptionsWhere } from 'typeorm';

export interface PaginationInput {
  current?: number;
  pageSize?: number;
}

export interface SortInput {
  sortField?: string;
  sortType?: 'ASC' | 'DESC';
}

/**
 * WHERE condition for mutation chains.
 * Either a TypeORM FindOptionsWhere object or a [condition, params] tuple.
 */
export type MutationWhere<T> =
  | FindOptionsWhere<T>
  | [condition: string, params: Record<string, unknown>];
```

- [ ] **Step 2: Create entity-registry.ts**

Create `backend/src/infra/database/query-factory/entity-registry.ts`:

```typescript
import { Company } from '@infra/database/entities/administration/company.entity';
import { User } from '@infra/database/entities/administration/user.entity';
import { Program } from '@infra/database/entities/administration/program.entity';
import { Permission } from '@infra/database/entities/administration/permission.entity';
import { Role } from '@infra/database/entities/administration/role.entity';
import { RoleAuth } from '@infra/database/entities/administration/role-auth.entity';

/**
 * Central registry of all TypeORM entities.
 * Registered globally in DatabaseModule so feature modules do not need
 * TypeOrmModule.forFeature() or @InjectRepository().
 *
 * When you create a new entity, add it here.
 */
export const ALL_ENTITIES = [
  Company,
  User,
  Program,
  Permission,
  Role,
  RoleAuth,
];
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/infra/database/query-factory/types.ts backend/src/infra/database/query-factory/entity-registry.ts
git commit -m "feat(query-factory): add mutation types and entity registry"
```

---

### Task 2: DeleteChain

Starting with the simplest mutation chain to establish the pattern.

**Files:**
- Create: `backend/src/infra/database/query-factory/chains/delete-chain.ts`
- Create: `backend/src/infra/database/query-factory/__tests__/delete-chain.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/infra/database/query-factory/__tests__/delete-chain.spec.ts`:

```typescript
import { DeleteChain } from '../chains/delete-chain';

describe('DeleteChain', () => {
  let mockManager: any;

  beforeEach(() => {
    mockManager = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    };
  });

  class FakeEntity {
    id: string;
    name: string;
  }

  describe('where with object condition', () => {
    it('should delete matching rows using FindOptionsWhere', async () => {
      const chain = new DeleteChain<FakeEntity>(mockManager, FakeEntity);
      await chain.where({ id: 'role-1' } as any).execute();
      expect(mockManager.delete).toHaveBeenCalledWith(FakeEntity, { id: 'role-1' });
    });
  });

  describe('where with string condition', () => {
    it('should delete using query builder for string conditions', async () => {
      const chain = new DeleteChain<FakeEntity>(mockManager, FakeEntity);
      await chain.where('id = :id AND name = :name', { id: 'role-1', name: 'admin' }).execute();

      const qb = mockManager.createQueryBuilder.mock.results[0].value;
      expect(qb.delete).toHaveBeenCalled();
      expect(qb.from).toHaveBeenCalledWith(FakeEntity);
      expect(qb.where).toHaveBeenCalledWith('id = :id AND name = :name', { id: 'role-1', name: 'admin' });
      expect(qb.execute).toHaveBeenCalled();
    });
  });

  describe('execute without where', () => {
    it('should throw an error to prevent accidental full-table delete', async () => {
      const chain = new DeleteChain<FakeEntity>(mockManager, FakeEntity);
      await expect(chain.execute()).rejects.toThrow('DeleteChain requires a WHERE condition');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/delete-chain.spec.ts --no-cache`
Expected: FAIL — `Cannot find module '../chains/delete-chain'`

- [ ] **Step 3: Implement DeleteChain**

Create `backend/src/infra/database/query-factory/chains/delete-chain.ts`:

```typescript
import { EntityManager, EntityTarget, FindOptionsWhere, ObjectLiteral } from 'typeorm';

/**
 * Fluent builder for DELETE operations.
 * Requires a WHERE condition — will throw if execute() is called without one.
 */
export class DeleteChain<T extends ObjectLiteral> {
  private readonly manager: EntityManager;
  private readonly entity: EntityTarget<T>;
  private objectWhere: FindOptionsWhere<T> | null = null;
  private stringWhere: { condition: string; params: Record<string, unknown> } | null = null;

  constructor(manager: EntityManager, entity: EntityTarget<T>) {
    this.manager = manager;
    this.entity = entity;
  }

  where(condition: FindOptionsWhere<T>): this;
  where(condition: string, params: Record<string, unknown>): this;
  where(
    condition: FindOptionsWhere<T> | string,
    params?: Record<string, unknown>,
  ): this {
    if (typeof condition === 'string') {
      this.stringWhere = { condition, params: params! };
    } else {
      this.objectWhere = condition;
    }
    return this;
  }

  async execute(): Promise<void> {
    if (this.objectWhere) {
      await this.manager.delete(this.entity, this.objectWhere);
      return;
    }

    if (this.stringWhere) {
      await this.manager
        .createQueryBuilder()
        .delete()
        .from(this.entity)
        .where(this.stringWhere.condition, this.stringWhere.params)
        .execute();
      return;
    }

    throw new Error('DeleteChain requires a WHERE condition. Use .where() before .execute().');
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/delete-chain.spec.ts --no-cache`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/infra/database/query-factory/chains/delete-chain.ts backend/src/infra/database/query-factory/__tests__/delete-chain.spec.ts
git commit -m "feat(query-factory): add DeleteChain with object and string WHERE support"
```

---

### Task 3: InsertChain

**Files:**
- Create: `backend/src/infra/database/query-factory/chains/insert-chain.ts`
- Create: `backend/src/infra/database/query-factory/__tests__/insert-chain.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/infra/database/query-factory/__tests__/insert-chain.spec.ts`:

```typescript
import { InsertChain } from '../chains/insert-chain';

describe('InsertChain', () => {
  let mockManager: any;
  let mockQueryRunner: any;

  class FakeEntity {
    roleId: string;
    roleCd: string;
    roleNm: string;
  }

  beforeEach(() => {
    mockManager = {
      save: jest.fn().mockImplementation((entity, data) => {
        if (Array.isArray(data)) {
          return Promise.resolve(data.map((d, i) => ({ id: i, ...d })));
        }
        return Promise.resolve({ id: 1, ...data });
      }),
      create: jest.fn().mockImplementation((entity, data) => {
        if (Array.isArray(data)) return data;
        return { ...data };
      }),
    };
    mockQueryRunner = {
      query: jest.fn().mockResolvedValue([{ id: 'ROLE202604230001' }]),
    };
  });

  describe('basic insert', () => {
    it('should insert a single entity', async () => {
      const chain = new InsertChain<FakeEntity>(mockManager, FakeEntity, mockQueryRunner);
      await chain.values({ roleCd: 'ADMIN', roleNm: 'Administrator' } as any).execute();

      expect(mockManager.create).toHaveBeenCalledWith(FakeEntity, { roleCd: 'ADMIN', roleNm: 'Administrator' });
      expect(mockManager.save).toHaveBeenCalled();
    });
  });

  describe('insertMany', () => {
    it('should insert multiple entities', async () => {
      const chain = new InsertChain<FakeEntity>(mockManager, FakeEntity, mockQueryRunner);
      const items = [
        { roleCd: 'ADMIN', roleNm: 'Admin' },
        { roleCd: 'USER', roleNm: 'User' },
      ];
      await chain.values(items as any).execute();

      expect(mockManager.create).toHaveBeenCalledWith(FakeEntity, items);
      expect(mockManager.save).toHaveBeenCalled();
    });
  });

  describe('autoId', () => {
    it('should generate and set ID before insert', async () => {
      const chain = new InsertChain<FakeEntity>(mockManager, FakeEntity, mockQueryRunner);
      await chain
        .values({ roleCd: 'ADMIN', roleNm: 'Administrator' } as any)
        .autoId('roleId', 'ROLE', 'seq_role')
        .execute();

      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining('ROLE'),
      );
      // The created entity should have the generated roleId set
      const createdData = mockManager.create.mock.calls[0][1];
      expect(createdData.roleId).toBe('ROLE202604230001');
    });
  });

  describe('returning', () => {
    it('should return the saved entity', async () => {
      const chain = new InsertChain<FakeEntity>(mockManager, FakeEntity, mockQueryRunner);
      const result = await chain
        .values({ roleCd: 'ADMIN', roleNm: 'Administrator' } as any)
        .returning<{ roleId: string }>()
        .execute();

      expect(result).toHaveProperty('roleCd', 'ADMIN');
    });
  });

  describe('execute without values', () => {
    it('should throw', async () => {
      const chain = new InsertChain<FakeEntity>(mockManager, FakeEntity, mockQueryRunner);
      await expect(chain.execute()).rejects.toThrow('InsertChain requires .values()');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/insert-chain.spec.ts --no-cache`
Expected: FAIL — `Cannot find module '../chains/insert-chain'`

- [ ] **Step 3: Implement InsertChain**

Create `backend/src/infra/database/query-factory/chains/insert-chain.ts`:

```typescript
import { DeepPartial, EntityManager, EntityTarget, ObjectLiteral, QueryRunner } from 'typeorm';
import { generateIdExpression } from '@infra/common/utils/id-generator.util';

interface AutoIdConfig {
  field: string;
  prefix: string;
  sequence: string;
}

/**
 * Fluent builder for INSERT operations.
 * Supports single insert, bulk insert, auto-ID generation, and returning.
 */
export class InsertChain<T extends ObjectLiteral> {
  private readonly manager: EntityManager;
  private readonly entity: EntityTarget<T>;
  private readonly queryRunner: QueryRunner;
  private data: DeepPartial<T> | DeepPartial<T>[] | null = null;
  private autoIdConfig: AutoIdConfig | null = null;
  private shouldReturn = false;

  constructor(manager: EntityManager, entity: EntityTarget<T>, queryRunner: QueryRunner) {
    this.manager = manager;
    this.entity = entity;
    this.queryRunner = queryRunner;
  }

  values(data: DeepPartial<T> | DeepPartial<T>[]): this {
    this.data = data;
    return this;
  }

  autoId(field: keyof T & string, prefix: string, sequence: string): this {
    this.autoIdConfig = { field, prefix, sequence };
    return this;
  }

  returning<R = T>(): ReturningInsertChain<R> {
    this.shouldReturn = true;
    return this as unknown as ReturningInsertChain<R>;
  }

  async execute(): Promise<any> {
    if (this.data === null) {
      throw new Error('InsertChain requires .values() before .execute().');
    }

    let data = this.data;

    // Auto-ID generation (only for single inserts, not arrays)
    if (this.autoIdConfig && !Array.isArray(data)) {
      const { field, prefix, sequence } = this.autoIdConfig;
      const expr = generateIdExpression(prefix, sequence);
      const [result] = await this.queryRunner.query(`SELECT ${expr} as id`);
      (data as any)[field] = result.id;
    }

    const entities = this.manager.create(this.entity, data as any);
    const saved = await this.manager.save(this.entity, entities as any);

    if (this.shouldReturn) {
      return saved;
    }
  }
}

/**
 * Returned by InsertChain.returning() — execute() returns the saved entity.
 */
export class ReturningInsertChain<R> {
  async execute(): Promise<R> {
    // This is never called directly — InsertChain handles the logic
    // when shouldReturn is true. This class exists only for type inference.
    throw new Error('Internal error: ReturningInsertChain.execute should not be called directly');
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/insert-chain.spec.ts --no-cache`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/infra/database/query-factory/chains/insert-chain.ts backend/src/infra/database/query-factory/__tests__/insert-chain.spec.ts
git commit -m "feat(query-factory): add InsertChain with autoId and returning support"
```

---

### Task 4: UpdateChain

**Files:**
- Create: `backend/src/infra/database/query-factory/chains/update-chain.ts`
- Create: `backend/src/infra/database/query-factory/__tests__/update-chain.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/infra/database/query-factory/__tests__/update-chain.spec.ts`:

```typescript
import { NotFoundException } from '@nestjs/common';
import { UpdateChain } from '../chains/update-chain';

describe('UpdateChain', () => {
  let mockManager: any;

  class FakeEntity {
    coId: string;
    coNm: string;
    taxCd: string;
    useFlg: boolean;
  }

  beforeEach(() => {
    mockManager = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn().mockResolvedValue({
        coId: 'CO001',
        coNm: 'Old Name',
        taxCd: '12345',
        useFlg: true,
      }),
      save: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    };
  });

  describe('set with object where', () => {
    it('should update matching rows with explicit data', async () => {
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);
      await chain
        .where({ coId: 'CO001' } as any)
        .set({ coNm: 'New Name' } as any)
        .execute();

      expect(mockManager.update).toHaveBeenCalledWith(
        FakeEntity,
        { coId: 'CO001' },
        { coNm: 'New Name' },
      );
    });
  });

  describe('set with string where', () => {
    it('should use query builder for string conditions', async () => {
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);
      await chain
        .where('coId = :coId AND useFlg = :useFlg', { coId: 'CO001', useFlg: true })
        .set({ coNm: 'New Name' } as any)
        .execute();

      const qb = mockManager.createQueryBuilder.mock.results[0].value;
      expect(qb.update).toHaveBeenCalledWith(FakeEntity);
      expect(qb.set).toHaveBeenCalledWith({ coNm: 'New Name' });
      expect(qb.where).toHaveBeenCalledWith('coId = :coId AND useFlg = :useFlg', { coId: 'CO001', useFlg: true });
      expect(qb.execute).toHaveBeenCalled();
    });
  });

  describe('merge', () => {
    it('should fetch existing, merge non-null fields from dto, and save', async () => {
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);
      await chain
        .where({ coId: 'CO001' } as any)
        .merge({ coNm: 'Updated Name', taxCd: undefined, useFlg: null } as any)
        .execute();

      expect(mockManager.findOne).toHaveBeenCalledWith(FakeEntity, { where: { coId: 'CO001' } });
      // coNm should be updated, taxCd and useFlg should keep existing values
      expect(mockManager.save).toHaveBeenCalledWith(
        FakeEntity,
        expect.objectContaining({
          coId: 'CO001',
          coNm: 'Updated Name',
          taxCd: '12345',
          useFlg: true,
        }),
      );
    });

    it('should throw NotFoundException when entity not found', async () => {
      mockManager.findOne.mockResolvedValue(null);
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);

      await expect(
        chain.where({ coId: 'MISSING' } as any).merge({ coNm: 'X' } as any).execute(),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('execute without where', () => {
    it('should throw to prevent accidental full-table update', async () => {
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);
      await expect(
        chain.set({ coNm: 'X' } as any).execute(),
      ).rejects.toThrow('UpdateChain requires a WHERE condition');
    });
  });

  describe('execute without set or merge', () => {
    it('should throw when no data provided', async () => {
      const chain = new UpdateChain<FakeEntity>(mockManager, FakeEntity);
      await expect(
        chain.where({ coId: 'CO001' } as any).execute(),
      ).rejects.toThrow('UpdateChain requires .set() or .merge()');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/update-chain.spec.ts --no-cache`
Expected: FAIL — `Cannot find module '../chains/update-chain'`

- [ ] **Step 3: Implement UpdateChain**

Create `backend/src/infra/database/query-factory/chains/update-chain.ts`:

```typescript
import { NotFoundException } from '@nestjs/common';
import { DeepPartial, EntityManager, EntityTarget, FindOptionsWhere, ObjectLiteral } from 'typeorm';

/**
 * Fluent builder for UPDATE operations.
 *
 * Two modes:
 * - `.set(data)` — explicit partial update, uses manager.update() or QueryBuilder.
 * - `.merge(dto)` — auto-fetches existing row, shallow-merges non-null/undefined
 *   fields from dto, saves the result. Throws NotFoundException if row missing.
 */
export class UpdateChain<T extends ObjectLiteral> {
  private readonly manager: EntityManager;
  private readonly entity: EntityTarget<T>;
  private objectWhere: FindOptionsWhere<T> | null = null;
  private stringWhere: { condition: string; params: Record<string, unknown> } | null = null;
  private setData: DeepPartial<T> | null = null;
  private mergeDto: DeepPartial<T> | null = null;

  constructor(manager: EntityManager, entity: EntityTarget<T>) {
    this.manager = manager;
    this.entity = entity;
  }

  where(condition: FindOptionsWhere<T>): this;
  where(condition: string, params: Record<string, unknown>): this;
  where(
    condition: FindOptionsWhere<T> | string,
    params?: Record<string, unknown>,
  ): this {
    if (typeof condition === 'string') {
      this.stringWhere = { condition, params: params! };
    } else {
      this.objectWhere = condition;
    }
    return this;
  }

  set(data: DeepPartial<T>): this {
    this.setData = data;
    return this;
  }

  merge(dto: DeepPartial<T>): this {
    this.mergeDto = dto;
    return this;
  }

  async execute(): Promise<void> {
    if (!this.objectWhere && !this.stringWhere) {
      throw new Error('UpdateChain requires a WHERE condition. Use .where() before .execute().');
    }

    if (!this.setData && !this.mergeDto) {
      throw new Error('UpdateChain requires .set() or .merge() before .execute().');
    }

    // ── merge mode ──────────────────────────────────────────────────────
    if (this.mergeDto) {
      if (!this.objectWhere) {
        throw new Error('UpdateChain.merge() requires an object WHERE condition (not a string).');
      }

      const existing = await this.manager.findOne(this.entity, {
        where: this.objectWhere,
      } as any);

      if (!existing) {
        throw new NotFoundException(
          `Entity not found for merge update.`,
        );
      }

      // Shallow merge: only overwrite with non-null/non-undefined values from dto
      const merged = { ...existing };
      for (const [key, value] of Object.entries(this.mergeDto)) {
        if (value !== null && value !== undefined) {
          (merged as any)[key] = value;
        }
      }

      await this.manager.save(this.entity, merged);
      return;
    }

    // ── set mode with object where ──────────────────────────────────────
    if (this.objectWhere) {
      await this.manager.update(this.entity, this.objectWhere, this.setData!);
      return;
    }

    // ── set mode with string where ──────────────────────────────────────
    if (this.stringWhere) {
      await this.manager
        .createQueryBuilder()
        .update(this.entity)
        .set(this.setData! as any)
        .where(this.stringWhere.condition, this.stringWhere.params)
        .execute();
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/update-chain.spec.ts --no-cache`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/infra/database/query-factory/chains/update-chain.ts backend/src/infra/database/query-factory/__tests__/update-chain.spec.ts
git commit -m "feat(query-factory): add UpdateChain with set and merge modes"
```

---

### Task 5: UpsertChain

**Files:**
- Create: `backend/src/infra/database/query-factory/chains/upsert-chain.ts`
- Create: `backend/src/infra/database/query-factory/__tests__/upsert-chain.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/infra/database/query-factory/__tests__/upsert-chain.spec.ts`:

```typescript
import { UpsertChain } from '../chains/upsert-chain';

describe('UpsertChain', () => {
  let mockManager: any;

  class FakeEntity {
    roleId: string;
    pgmId: string;
    permId: string;
    activeYn: boolean;
  }

  beforeEach(() => {
    mockManager = {
      upsert: jest.fn().mockResolvedValue({}),
    };
  });

  describe('basic upsert', () => {
    it('should call manager.upsert with conflict columns and data', async () => {
      const chain = new UpsertChain<FakeEntity>(mockManager, FakeEntity);
      const data = [
        { roleId: 'R1', pgmId: 'P1', permId: 'X1', activeYn: true },
        { roleId: 'R1', pgmId: 'P2', permId: 'X2', activeYn: false },
      ];

      await chain
        .values(data as any)
        .conflictOn(['roleId', 'pgmId', 'permId'])
        .mergeFields(['activeYn'])
        .execute();

      expect(mockManager.upsert).toHaveBeenCalledWith(
        FakeEntity,
        data,
        {
          conflictPaths: ['roleId', 'pgmId', 'permId'],
          skipUpdateIfNoValuesChanged: true,
        },
      );
    });
  });

  describe('single value upsert', () => {
    it('should wrap single value in array', async () => {
      const chain = new UpsertChain<FakeEntity>(mockManager, FakeEntity);
      await chain
        .values({ roleId: 'R1', pgmId: 'P1', permId: 'X1', activeYn: true } as any)
        .conflictOn(['roleId', 'pgmId', 'permId'])
        .mergeFields(['activeYn'])
        .execute();

      expect(mockManager.upsert).toHaveBeenCalledWith(
        FakeEntity,
        [{ roleId: 'R1', pgmId: 'P1', permId: 'X1', activeYn: true }],
        expect.any(Object),
      );
    });
  });

  describe('execute without values', () => {
    it('should throw', async () => {
      const chain = new UpsertChain<FakeEntity>(mockManager, FakeEntity);
      await expect(
        chain.conflictOn(['roleId']).mergeFields(['activeYn']).execute(),
      ).rejects.toThrow('UpsertChain requires .values()');
    });
  });

  describe('execute without conflictOn', () => {
    it('should throw', async () => {
      const chain = new UpsertChain<FakeEntity>(mockManager, FakeEntity);
      await expect(
        chain.values({ roleId: 'R1' } as any).mergeFields(['activeYn']).execute(),
      ).rejects.toThrow('UpsertChain requires .conflictOn()');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/upsert-chain.spec.ts --no-cache`
Expected: FAIL — `Cannot find module '../chains/upsert-chain'`

- [ ] **Step 3: Implement UpsertChain**

Create `backend/src/infra/database/query-factory/chains/upsert-chain.ts`:

```typescript
import { DeepPartial, EntityManager, EntityTarget, ObjectLiteral } from 'typeorm';

/**
 * Fluent builder for UPSERT (INSERT ... ON CONFLICT ... DO UPDATE) operations.
 * Uses TypeORM's manager.upsert() under the hood.
 */
export class UpsertChain<T extends ObjectLiteral> {
  private readonly manager: EntityManager;
  private readonly entity: EntityTarget<T>;
  private data: DeepPartial<T>[] | null = null;
  private conflictColumns: (keyof T & string)[] | null = null;
  private mergeColumns: (keyof T & string)[] | null = null;

  constructor(manager: EntityManager, entity: EntityTarget<T>) {
    this.manager = manager;
    this.entity = entity;
  }

  values(data: DeepPartial<T> | DeepPartial<T>[]): this {
    this.data = Array.isArray(data) ? data : [data];
    return this;
  }

  conflictOn(fields: (keyof T & string)[]): this {
    this.conflictColumns = fields;
    return this;
  }

  mergeFields(fields: (keyof T & string)[]): this {
    this.mergeColumns = fields;
    return this;
  }

  async execute(): Promise<void> {
    if (!this.data) {
      throw new Error('UpsertChain requires .values() before .execute().');
    }
    if (!this.conflictColumns) {
      throw new Error('UpsertChain requires .conflictOn() before .execute().');
    }

    await this.manager.upsert(this.entity, this.data as any, {
      conflictPaths: this.conflictColumns,
      skipUpdateIfNoValuesChanged: true,
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/upsert-chain.spec.ts --no-cache`
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/infra/database/query-factory/chains/upsert-chain.ts backend/src/infra/database/query-factory/__tests__/upsert-chain.spec.ts
git commit -m "feat(query-factory): add UpsertChain with conflictOn and mergeFields"
```

---

### Task 6: TransactionContext

**Files:**
- Create: `backend/src/infra/database/query-factory/transaction-context.ts`
- Create: `backend/src/infra/database/query-factory/__tests__/transaction-context.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/infra/database/query-factory/__tests__/transaction-context.spec.ts`:

```typescript
import { TransactionContext } from '../transaction-context';

describe('TransactionContext', () => {
  let mockQueryRunner: any;
  let mockDataSource: any;
  let mockManager: any;

  class FakeEntity {
    id: string;
    name: string;
  }

  beforeEach(() => {
    mockManager = {
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      save: jest.fn().mockImplementation((_e, data) => Promise.resolve(data)),
      create: jest.fn().mockImplementation((_e, data) => data),
      findOne: jest.fn().mockResolvedValue({ id: 'X1', name: 'Test' }),
      upsert: jest.fn().mockResolvedValue({}),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
        getMany: jest.fn().mockResolvedValue([]),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        delete: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected: 1 }),
      }),
    };
    mockQueryRunner = {
      manager: mockManager,
      query: jest.fn().mockResolvedValue([{ id: 'GEN001' }]),
    };
    mockDataSource = {
      createQueryBuilder: jest.fn().mockReturnValue(mockManager.createQueryBuilder()),
    };
  });

  function createTx() {
    return new TransactionContext(mockQueryRunner, mockDataSource);
  }

  describe('insert', () => {
    it('should return an InsertChain', () => {
      const tx = createTx();
      const chain = tx.insert(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.values).toBe('function');
      expect(typeof chain.autoId).toBe('function');
    });
  });

  describe('insertMany', () => {
    it('should return an InsertChain (same class, semantic alias)', () => {
      const tx = createTx();
      const chain = tx.insertMany(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.values).toBe('function');
    });
  });

  describe('update', () => {
    it('should return an UpdateChain', () => {
      const tx = createTx();
      const chain = tx.update(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.where).toBe('function');
      expect(typeof chain.set).toBe('function');
      expect(typeof chain.merge).toBe('function');
    });
  });

  describe('updateMany', () => {
    it('should return an UpdateChain (same class, semantic alias)', () => {
      const tx = createTx();
      const chain = tx.updateMany(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.set).toBe('function');
    });
  });

  describe('delete', () => {
    it('should return a DeleteChain', () => {
      const tx = createTx();
      const chain = tx.delete(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.where).toBe('function');
    });
  });

  describe('upsert', () => {
    it('should return an UpsertChain', () => {
      const tx = createTx();
      const chain = tx.upsert(FakeEntity);
      expect(chain).toBeDefined();
      expect(typeof chain.values).toBe('function');
      expect(typeof chain.conflictOn).toBe('function');
    });
  });

  describe('findOne', () => {
    it('should delegate to manager.findOne', async () => {
      const tx = createTx();
      const result = await tx.findOne(FakeEntity, { id: 'X1' } as any);
      expect(mockManager.findOne).toHaveBeenCalledWith(FakeEntity, { where: { id: 'X1' } });
      expect(result).toEqual({ id: 'X1', name: 'Test' });
    });
  });

  describe('findOneOrFail', () => {
    it('should return entity when found', async () => {
      const tx = createTx();
      const result = await tx.findOneOrFail(FakeEntity, { id: 'X1' } as any);
      expect(result).toEqual({ id: 'X1', name: 'Test' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockManager.findOne.mockResolvedValue(null);
      const tx = createTx();
      await expect(tx.findOneOrFail(FakeEntity, { id: 'MISSING' } as any))
        .rejects.toThrow('Entity not found');
    });
  });

  describe('genId', () => {
    it('should generate ID using QueryRunner.query', async () => {
      const tx = createTx();
      const id = await tx.genId('ROLE', 'seq_role');
      expect(mockQueryRunner.query).toHaveBeenCalledWith(
        expect.stringContaining('ROLE'),
      );
      expect(id).toBe('GEN001');
    });
  });

  describe('select', () => {
    it('should return a QueryChain using transaction manager', () => {
      const tx = createTx();
      const chain = tx.select(FakeEntity, 'f');
      expect(chain).toBeDefined();
      expect(typeof chain.where).toBe('function');
      expect(typeof chain.getMany).toBe('function');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/transaction-context.spec.ts --no-cache`
Expected: FAIL — `Cannot find module '../transaction-context'`

- [ ] **Step 3: Implement TransactionContext**

Create `backend/src/infra/database/query-factory/transaction-context.ts`:

```typescript
import { NotFoundException } from '@nestjs/common';
import {
  DataSource,
  EntityTarget,
  FindOptionsWhere,
  ObjectLiteral,
  QueryRunner,
} from 'typeorm';
import { QueryChain } from './query-chain';
import { RawQueryChain } from './raw-query-chain';
import { InsertChain } from './chains/insert-chain';
import { UpdateChain } from './chains/update-chain';
import { DeleteChain } from './chains/delete-chain';
import { UpsertChain } from './chains/upsert-chain';
import { generateIdExpression } from '@infra/common/utils/id-generator.util';

/**
 * Transaction-scoped context passed to the callback of `QueryFactory.transaction()`.
 *
 * All reads and writes go through the same QueryRunner so they participate
 * in the same database transaction.
 */
export class TransactionContext {
  private readonly queryRunner: QueryRunner;
  private readonly dataSource: DataSource;

  constructor(queryRunner: QueryRunner, dataSource: DataSource) {
    this.queryRunner = queryRunner;
    this.dataSource = dataSource;
  }

  // ─── Reads ──────────────────────────────────────────────────────────────────

  /**
   * Creates a QueryChain on the transaction connection.
   */
  select<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T> {
    const qb = this.queryRunner.manager
      .createQueryBuilder<T>(entity, alias);
    if (columns && columns.length > 0) {
      qb.select(columns);
    }
    return new QueryChain<T>(qb);
  }

  /**
   * Creates a RawQueryChain on the transaction connection.
   */
  raw<T = any>(sql: string): RawQueryChain<T> {
    return new RawQueryChain<T>(this.dataSource, sql);
  }

  async findOne<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    where: FindOptionsWhere<T>,
  ): Promise<T | null> {
    return this.queryRunner.manager.findOne(entity, { where } as any);
  }

  async findOneOrFail<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    where: FindOptionsWhere<T>,
  ): Promise<T> {
    const result = await this.findOne(entity, where);
    if (!result) {
      throw new NotFoundException('Entity not found.');
    }
    return result;
  }

  // ─── ID generation ──────────────────────────────────────────────────────────

  async genId(prefix: string, sequence: string): Promise<string> {
    const expr = generateIdExpression(prefix, sequence);
    const [result] = await this.queryRunner.query(`SELECT ${expr} as id`);
    return result.id;
  }

  // ─── Mutations ──────────────────────────────────────────────────────────────

  insert<T extends ObjectLiteral>(entity: EntityTarget<T>): InsertChain<T> {
    return new InsertChain<T>(this.queryRunner.manager, entity, this.queryRunner);
  }

  /** Semantic alias for insert() — same chain, accepts arrays via .values(). */
  insertMany<T extends ObjectLiteral>(entity: EntityTarget<T>): InsertChain<T> {
    return this.insert(entity);
  }

  update<T extends ObjectLiteral>(entity: EntityTarget<T>): UpdateChain<T> {
    return new UpdateChain<T>(this.queryRunner.manager, entity);
  }

  /** Semantic alias for update() — use .where() with IN() for bulk updates. */
  updateMany<T extends ObjectLiteral>(entity: EntityTarget<T>): UpdateChain<T> {
    return this.update(entity);
  }

  delete<T extends ObjectLiteral>(entity: EntityTarget<T>): DeleteChain<T> {
    return new DeleteChain<T>(this.queryRunner.manager, entity);
  }

  upsert<T extends ObjectLiteral>(entity: EntityTarget<T>): UpsertChain<T> {
    return new UpsertChain<T>(this.queryRunner.manager, entity);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/transaction-context.spec.ts --no-cache`
Expected: 11 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/infra/database/query-factory/transaction-context.ts backend/src/infra/database/query-factory/__tests__/transaction-context.spec.ts
git commit -m "feat(query-factory): add TransactionContext with reads, mutations, and genId"
```

---

### Task 7: Extend QueryFactory with transaction(), findOne(), genId()

**Files:**
- Modify: `backend/src/infra/database/query-factory/query-factory.service.ts`
- Create: `backend/src/infra/database/query-factory/__tests__/query-factory-crud.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/infra/database/query-factory/__tests__/query-factory-crud.spec.ts`:

```typescript
import { NotFoundException } from '@nestjs/common';
import { QueryFactory } from '../query-factory.service';

describe('QueryFactory CRUD extensions', () => {
  let mockDataSource: any;
  let qf: QueryFactory;

  class FakeEntity {
    id: string;
    name: string;
  }

  beforeEach(() => {
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
        manager: {
          findOne: jest.fn().mockResolvedValue({ id: 'X1', name: 'Test' }),
          save: jest.fn().mockImplementation((_e, d) => Promise.resolve(d)),
          create: jest.fn().mockImplementation((_e, d) => d),
          delete: jest.fn().mockResolvedValue({ affected: 1 }),
          update: jest.fn().mockResolvedValue({ affected: 1 }),
          upsert: jest.fn().mockResolvedValue({}),
          createQueryBuilder: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            getMany: jest.fn().mockResolvedValue([]),
          }),
        },
        query: jest.fn().mockResolvedValue([{ id: 'GEN001' }]),
      }),
      createQueryBuilder: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      }),
      getRepository: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({ id: 'X1', name: 'Test' }),
      }),
      query: jest.fn().mockResolvedValue([{ id: 'GEN001' }]),
    };
    qf = new QueryFactory(mockDataSource);
  });

  describe('transaction', () => {
    it('should commit on success and return result', async () => {
      const qr = mockDataSource.createQueryRunner();
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      const result = await qf.transaction(async (tx) => {
        return 'hello';
      });

      expect(result).toBe('hello');
      expect(qr.connect).toHaveBeenCalled();
      expect(qr.startTransaction).toHaveBeenCalled();
      expect(qr.commitTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
      expect(qr.rollbackTransaction).not.toHaveBeenCalled();
    });

    it('should rollback on error and re-throw', async () => {
      const qr = mockDataSource.createQueryRunner();
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      await expect(
        qf.transaction(async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');

      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
      expect(qr.commitTransaction).not.toHaveBeenCalled();
    });

    it('should always release QueryRunner even on error', async () => {
      const qr = mockDataSource.createQueryRunner();
      mockDataSource.createQueryRunner.mockReturnValue(qr);

      try {
        await qf.transaction(async () => { throw new Error('fail'); });
      } catch {}

      expect(qr.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should find entity via DataSource repository', async () => {
      const result = await qf.findOne(FakeEntity, { id: 'X1' } as any);
      expect(result).toEqual({ id: 'X1', name: 'Test' });
    });

    it('should return null when not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);
      const result = await qf.findOne(FakeEntity, { id: 'MISSING' } as any);
      expect(result).toBeNull();
    });
  });

  describe('findOneOrFail', () => {
    it('should return entity when found', async () => {
      const result = await qf.findOneOrFail(FakeEntity, { id: 'X1' } as any);
      expect(result).toEqual({ id: 'X1', name: 'Test' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockDataSource.getRepository().findOne.mockResolvedValue(null);
      await expect(
        qf.findOneOrFail(FakeEntity, { id: 'MISSING' } as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('genId', () => {
    it('should generate ID via DataSource.query', async () => {
      const id = await qf.genId('ROLE', 'seq_role');
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('ROLE'),
      );
      expect(id).toBe('GEN001');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/query-factory-crud.spec.ts --no-cache`
Expected: FAIL — `qf.transaction is not a function`

- [ ] **Step 3: Extend QueryFactory**

Edit `backend/src/infra/database/query-factory/query-factory.service.ts` — replace entire content:

```typescript
import { Injectable } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { DataSource, EntityTarget, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { QueryChain } from './query-chain';
import { RawQueryChain } from './raw-query-chain';
import { TransactionContext } from './transaction-context';
import { generateIdExpression } from '@infra/common/utils/id-generator.util';

/**
 * QueryFactory provides a fluent, auto-skip-aware query builder surface on top
 * of TypeORM's SelectQueryBuilder and raw DataSource.query().
 *
 * It is registered as a @Global() provider via QueryFactoryModule so it can be
 * injected into any service without needing to import QueryFactoryModule locally.
 */
@Injectable()
export class QueryFactory {
  constructor(private readonly dataSource: DataSource) {}

  // ─── Existing read methods (unchanged) ──────────────────────────────────────

  /**
   * Creates a QueryChain from the DataSource (entity manager) query builder.
   */
  select<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T> {
    const qb = this.dataSource.createQueryBuilder<T>(entity, alias);
    if (columns && columns.length > 0) {
      qb.select(columns);
    }
    return new QueryChain<T>(qb);
  }

  /**
   * Creates a QueryChain from an injected Repository's query builder.
   */
  from<T extends ObjectLiteral>(
    repository: Repository<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T> {
    const qb = repository.createQueryBuilder(alias);
    if (columns && columns.length > 0) {
      qb.select(columns);
    }
    return new QueryChain<T>(qb);
  }

  /**
   * Creates a RawQueryChain for arbitrary SQL execution.
   */
  raw<T = any>(sql: string): RawQueryChain<T> {
    return new RawQueryChain<T>(this.dataSource, sql);
  }

  /**
   * Alias for `select()` intended for constructing correlated subqueries.
   */
  subQuery<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T> {
    return this.select<T>(entity, alias, columns);
  }

  // ─── Transaction ────────────────────────────────────────────────────────────

  /**
   * Executes a callback within a database transaction.
   *
   * - Auto-commits on success, auto-rollbacks on throw.
   * - QueryRunner is always released in `finally`.
   * - The return value of the callback becomes the return value of this method.
   */
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

  // ─── Standalone helpers ─────────────────────────────────────────────────────

  /**
   * Find a single entity by conditions. Runs outside a transaction.
   */
  async findOne<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    where: FindOptionsWhere<T>,
  ): Promise<T | null> {
    const repo = this.dataSource.getRepository(entity);
    return repo.findOne({ where } as any);
  }

  /**
   * Find a single entity or throw NotFoundException.
   */
  async findOneOrFail<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    where: FindOptionsWhere<T>,
  ): Promise<T> {
    const result = await this.findOne(entity, where);
    if (!result) {
      throw new NotFoundException('Entity not found.');
    }
    return result;
  }

  /**
   * Generate a sequence-based ID. Runs outside a transaction.
   * For transactional ID generation, use `tx.genId()` instead.
   */
  async genId(prefix: string, sequence: string): Promise<string> {
    const expr = generateIdExpression(prefix, sequence);
    const [result] = await this.dataSource.query(`SELECT ${expr} as id`);
    return result.id;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/query-factory-crud.spec.ts --no-cache`
Expected: 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/infra/database/query-factory/query-factory.service.ts backend/src/infra/database/query-factory/__tests__/query-factory-crud.spec.ts
git commit -m "feat(query-factory): add transaction(), findOne(), findOneOrFail(), genId()"
```

---

### Task 8: Update Exports & Global Entity Registration

**Files:**
- Modify: `backend/src/infra/database/query-factory/index.ts`
- Modify: `backend/src/infra/database/database.module.ts`

- [ ] **Step 1: Update index.ts re-exports**

Edit `backend/src/infra/database/query-factory/index.ts` — replace entire content:

```typescript
export { QueryFactory } from './query-factory.service';
export { QueryChain } from './query-chain';
export type { SortWhitelist, OrderByManyOptions } from './query-chain';
export { RawQueryChain } from './raw-query-chain';
export { QueryFactoryModule } from './query-factory.module';
export type { PaginationInput, SortInput, MutationWhere } from './types';
export { TransactionContext } from './transaction-context';
export { InsertChain } from './chains/insert-chain';
export { UpdateChain } from './chains/update-chain';
export { DeleteChain } from './chains/delete-chain';
export { UpsertChain } from './chains/upsert-chain';
export { ALL_ENTITIES } from './entity-registry';
```

- [ ] **Step 2: Update DatabaseModule for global entity registration**

Edit `backend/src/infra/database/database.module.ts` — replace entire content:

```typescript
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryFactoryModule } from './query-factory';
import { PostgresConfigModule } from './configs';
import { ALL_ENTITIES } from './query-factory/entity-registry';

/**
 * DatabaseModule registers all entities globally so feature modules
 * do not need TypeOrmModule.forFeature() or @InjectRepository().
 *
 * Services should inject only QueryFactory for all database operations.
 */
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

- [ ] **Step 3: Verify the project compiles**

Run: `cd backend && npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Run all query-factory tests**

Run: `cd backend && npx jest src/infra/database/query-factory/__tests__/ --no-cache`
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/infra/database/query-factory/index.ts backend/src/infra/database/database.module.ts
git commit -m "feat(query-factory): update exports and register all entities globally in DatabaseModule"
```

---

### Task 9: Update Developer Guide

**Files:**
- Modify: `backend/docs/query-factory.md`

- [ ] **Step 1: Append CRUD & Transaction sections to the developer guide**

Open `backend/docs/query-factory.md` and append the following after the existing `## Migration Checklist` section (after line 393):

```markdown

---

## Transactions & Mutations

All write operations go through `qf.transaction()`. This ensures consistent commit/rollback behavior and eliminates manual QueryRunner management.

### Transaction Basics

```typescript
// Auto-commit on success, auto-rollback on throw, auto-release always
const result = await this.qf.transaction(async (tx) => {
  // reads, writes, ID generation — all on the same connection
  return someValue;
});

// Rollback: just throw
await this.qf.transaction(async (tx) => {
  await tx.insert(Role).values(data).execute();
  if (conflict) {
    throw new BadRequestException('Duplicate'); // everything rolled back
  }
});
```

### INSERT

```typescript
await this.qf.transaction(async (tx) => {
  // Basic insert
  await tx.insert(Role).values({ roleCd: 'ADMIN', roleNm: 'Admin' }).execute();

  // With auto-generated ID
  await tx.insert(Role)
    .values({ roleCd: 'ADMIN', roleNm: 'Admin' })
    .autoId('roleId', 'ROLE', 'seq_role')
    .execute();

  // With returning
  const saved = await tx.insert(Role)
    .values({ roleCd: 'ADMIN' })
    .autoId('roleId', 'ROLE', 'seq_role')
    .returning<Role>()
    .execute();

  // Bulk insert
  await tx.insertMany(RoleAuth).values([
    { roleId, pgmId: 'P1', permId: 'R' },
    { roleId, pgmId: 'P2', permId: 'W' },
  ]).execute();
});
```

### UPDATE

```typescript
await this.qf.transaction(async (tx) => {
  // Explicit set
  await tx.update(Role)
    .where({ roleId })
    .set({ roleNm: 'New Name', updatedBy: 'admin' })
    .execute();

  // Auto-merge — fetches existing, merges non-null/undefined fields from dto
  // Replaces manual `dto.field ?? existing.field` blocks
  await tx.update(Company)
    .where({ coId: dto.coId })
    .merge(dto)
    .execute();

  // String WHERE for complex conditions
  await tx.update(Company)
    .where('coId = :coId AND useFlg = :useFlg', { coId, useFlg: true })
    .set({ coNm: 'Updated' })
    .execute();

  // Bulk update
  await tx.updateMany(User)
    .where({ usrId: In(ids) })
    .set({ usrPwd: hashed })
    .execute();
});
```

### DELETE

```typescript
await this.qf.transaction(async (tx) => {
  await tx.delete(RoleAuth).where({ roleId }).execute();
});
```

### UPSERT

```typescript
await this.qf.transaction(async (tx) => {
  await tx.upsert(RoleAuth)
    .values(authList)
    .conflictOn(['roleId', 'pgmId', 'permId'])
    .mergeFields(['activeYn', 'updatedBy'])
    .execute();
});
```

### Reads Inside Transactions

```typescript
await this.qf.transaction(async (tx) => {
  // QueryChain (same API as qf.select)
  const roles = await tx.select(Role, 'r')
    .where('r.useFlg = :useFlg', { useFlg: true })
    .getMany();

  // Simple findOne
  const role = await tx.findOne(Role, { roleId });

  // findOneOrFail (throws NotFoundException)
  const company = await tx.findOneOrFail(Company, { coId });

  // ID generation inside transaction
  const id = await tx.genId('ROLE', 'seq_role');
});
```

### Standalone Helpers

For simple reads outside transactions:

```typescript
// Find without transaction
const role = await this.qf.findOne(Role, { roleCd: 'ADMIN' });
const company = await this.qf.findOneOrFail(Company, { coId });

// ID generation without transaction
const id = await this.qf.genId('CO', 'seq_co');
```

---

## Global Entity Registration

All entities are registered once in `DatabaseModule`. Feature modules do **not** need `TypeOrmModule.forFeature()`.

When adding a new entity:
1. Create the entity file in `src/infra/database/entities/`
2. Add it to `ALL_ENTITIES` in `src/infra/database/query-factory/entity-registry.ts`

Services inject only `QueryFactory`:

```typescript
@Injectable()
export class MyService {
  constructor(private readonly qf: QueryFactory) {}
}
```

No `@InjectRepository()`, no `DataSource`, no `Repository<T>`.

---

## CRUD Migration Checklist

When converting an existing service to use the new CRUD chains:

1. Remove `@InjectRepository(Entity)` from constructor
2. Remove `private readonly repository: Repository<Entity>` fields
3. Remove `private readonly dataSource: DataSource` (unless used for non-QueryFactory operations)
4. Keep only `private readonly qf: QueryFactory` in constructor
5. Remove `TypeOrmModule.forFeature([...])` from the feature module
6. Replace `repository.findOne({ where })` with `this.qf.findOne(Entity, where)`
7. Replace `repository.create()` + `repository.save()` with `tx.insert(Entity).values().execute()`
8. Replace `generateId(this.dataSource, ...)` with `tx.genId(...)` or `this.qf.genId(...)`
9. Replace manual merge blocks (`dto.field ?? existing.field`) with `tx.update(Entity).where().merge(dto).execute()`
10. Replace `dataSource.query('DELETE ...')` with `tx.delete(Entity).where().execute()`
11. Replace `dataSource.query('INSERT ... ON CONFLICT ...')` with `tx.upsert(Entity).values().conflictOn().mergeFields().execute()`
12. Wrap multi-step writes in `this.qf.transaction(async (tx) => { ... })`
```

- [ ] **Step 2: Commit**

```bash
git add backend/docs/query-factory.md
git commit -m "docs: add CRUD, transaction, and global entity registration sections to developer guide"
```

---

## Summary

| Task | What | Tests |
|------|------|-------|
| 1 | Types & entity registry | — |
| 2 | DeleteChain | 3 tests |
| 3 | InsertChain | 5 tests |
| 4 | UpdateChain | 5 tests |
| 5 | UpsertChain | 4 tests |
| 6 | TransactionContext | 11 tests |
| 7 | QueryFactory extensions | 7 tests |
| 8 | Exports & global registration | compile + all tests |
| 9 | Developer guide update | — |
| **Total** | **9 tasks** | **35 tests** |
