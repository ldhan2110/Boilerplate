import { Injectable } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions';
import { DataSource, EntityTarget, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { QueryChain } from './query-chain';
import { RawQueryChain } from './raw-query-chain';
import { TransactionContext } from './transaction-context';
import { generateEntityIdExpression } from '@infra/common/utils';
import { RequestContext } from '@infra/tenant/request-context';

@Injectable()
export class QueryFactory {
  constructor(private readonly dataSource: DataSource) {}

  // Existing read methods (unchanged)

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

  raw<T = any>(sql: string): RawQueryChain<T> {
    return new RawQueryChain<T>(this.dataSource, sql);
  }

  subQuery<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    alias: string,
    columns?: string[],
  ): QueryChain<T> {
    return this.select<T>(entity, alias, columns);
  }

  // Transaction

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

  // Standalone helpers

  async findOne<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    where: FindOptionsWhere<T>,
  ): Promise<T | null> {
    const repo = this.dataSource.getRepository(entity);
    return repo.findOne({ where } as any);
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

  async genId(prefix: string): Promise<string> {
    const coId = RequestContext.requireTenantId();
    const expr = generateEntityIdExpression(coId, prefix);
    const [result] = await this.dataSource.query(`SELECT ${expr} as id`);
    return result.id;
  }
}
