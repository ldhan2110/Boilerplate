import { BizException } from '@infra/common/exceptions';
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
import { generateEntityIdExpression } from '@infra/common/utils';
import { RequestContext } from '@infra/tenant/request-context';

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

  // Reads

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
      throw new BizException('SYS000002', 'ERROR', 'Entity not found');
    }
    return result;
  }

  // ID generation

  async genId(prefix: string): Promise<string> {
    const coId = RequestContext.requireTenantId();
    const expr = generateEntityIdExpression(coId, prefix);
    const [result] = await this.queryRunner.query(`SELECT ${expr} as id`);
    return result.id;
  }

  // Mutations

  insert<T extends ObjectLiteral>(entity: EntityTarget<T>): InsertChain<T> {
    return new InsertChain<T>(this.queryRunner.manager, entity, this.queryRunner);
  }

  insertMany<T extends ObjectLiteral>(entity: EntityTarget<T>): InsertChain<T> {
    return this.insert(entity);
  }

  update<T extends ObjectLiteral>(entity: EntityTarget<T>): UpdateChain<T> {
    return new UpdateChain<T>(this.queryRunner.manager, entity);
  }

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
