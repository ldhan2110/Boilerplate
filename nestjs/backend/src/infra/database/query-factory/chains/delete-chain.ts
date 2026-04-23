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
