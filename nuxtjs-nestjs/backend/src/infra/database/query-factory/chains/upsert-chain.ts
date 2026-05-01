import { RequestContext } from '@infra/tenant/request-context';
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

    const tenantId = RequestContext.getTenantId();
    const currentUserId = RequestContext.getUserId();
    for (const item of this.data) {
      if (tenantId && !(item as any).coId) (item as any).coId = tenantId;
      if (currentUserId) {
        if (!(item as any).createdBy) (item as any).createdBy = currentUserId;
        if (!(item as any).updatedBy) (item as any).updatedBy = currentUserId;
      }
    }

    await this.manager.upsert(this.entity, this.data as any, {
      conflictPaths: this.conflictColumns,
      skipUpdateIfNoValuesChanged: true,
    });
  }
}
