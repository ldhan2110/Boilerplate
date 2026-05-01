import { DeepPartial, EntityManager, EntityTarget, ObjectLiteral, QueryRunner } from 'typeorm';
import { generateEntityIdExpression } from '@infra/common/utils';
import { TenantContext } from '@infra/tenant/tenant-context';
import { UserContext } from '@infra/user-context';
import { getAutoIdMeta } from '../../decorators';

interface AutoIdConfig {
  field: string;
  prefix: string;
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

  autoId(field: keyof T & string, prefix: string): this {
    this.autoIdConfig = { field, prefix };
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

    // Resolve auto-ID config: explicit .autoId() takes precedence, then @AutoId decorator
    const idConfig = this.autoIdConfig ?? getAutoIdMeta(this.entity as Function);

    if (idConfig) {
      const { field, prefix } = 'propertyKey' in idConfig
        ? { field: idConfig.propertyKey, prefix: idConfig.prefix }
        : idConfig;
      const coId = TenantContext.requireTenantId();

      if (Array.isArray(data)) {
        for (const item of data) {
          if (!(item as any)[field]) {
            const expr = generateEntityIdExpression(coId, prefix);
            const [result] = await this.queryRunner.query(`SELECT ${expr} as id`);
            (item as any)[field] = result.id;
          }
        }
      } else {
        if (!(data as any)[field]) {
          const expr = generateEntityIdExpression(coId, prefix);
          const [result] = await this.queryRunner.query(`SELECT ${expr} as id`);
          (data as any)[field] = result.id;
        }
      }
    }

    // Auto-inject context fields (skip if no context, explicit values win)
    const tenantId = TenantContext.getTenantId();
    const currentUserId = UserContext.getUserId();

    if (Array.isArray(data)) {
      for (const item of data) {
        if (tenantId && !(item as any).coId) (item as any).coId = tenantId;
        if (currentUserId) {
          if (!(item as any).createdBy) (item as any).createdBy = currentUserId;
          if (!(item as any).updatedBy) (item as any).updatedBy = currentUserId;
        }
      }
    } else {
      if (tenantId && !(data as any).coId) (data as any).coId = tenantId;
      if (currentUserId) {
        if (!(data as any).createdBy) (data as any).createdBy = currentUserId;
        if (!(data as any).updatedBy) (data as any).updatedBy = currentUserId;
      }
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
    throw new Error('Internal error: ReturningInsertChain.execute should not be called directly');
  }
}
