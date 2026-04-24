import { DeepPartial, EntityManager, EntityTarget, ObjectLiteral, QueryRunner } from 'typeorm';
import { generateIdExpression } from '@infra/common/utils';

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
    throw new Error('Internal error: ReturningInsertChain.execute should not be called directly');
  }
}
