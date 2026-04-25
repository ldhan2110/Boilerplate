import {
  ObjectLiteral,
  SelectQueryBuilder,
  EntityTarget,
  ObjectType,
} from 'typeorm';
import type { PaginationInput, SortInput } from './types';

/**
 * Whitelist maps a client-facing field name to the SQL column expression.
 * Example: { createdAt: 'user.created_at' }
 */
export type SortWhitelist = Record<string, string>;

export interface OrderByManyOptions {
  /** Fallback sort when no valid sort is resolved. Tuple of [column, direction]. */
  default?: [string, 'ASC' | 'DESC'];
}

/**
 * Fluent wrapper around TypeORM's SelectQueryBuilder.
 *
 * Auto-skip semantics: WHERE methods (where / andWhere / orWhere) silently
 * skip the clause if any supplied parameter value is null or undefined.
 * Use the *Strict variants to bypass this behaviour.
 */
export class QueryChain<T extends ObjectLiteral> {
  private readonly qb: SelectQueryBuilder<T>;

  constructor(qb: SelectQueryBuilder<T>) {
    this.qb = qb;
  }

  // ─── Internals ──────────────────────────────────────────────────────────────

  /**
   * Returns true when at least one value in `params` is null or undefined,
   * or when `params` itself is null / undefined.
   * Returns false (do NOT skip) when params is an empty object or omitted.
   */
  shouldSkip(params?: Record<string, unknown>): boolean {
    if (params === null || params === undefined) {
      return false; // no params object → nothing to skip on
    }
    return Object.values(params).some((v) => v === null || v === undefined);
  }

  // ─── SELECT ─────────────────────────────────────────────────────────────────

  select(columns: string[]): this {
    this.qb.select(columns);
    return this;
  }

  /**
   * Adds a column or a subquery to the SELECT list.
   * When `columnOrSubQuery` is a QueryChain the inner QB is used as a
   * correlated subquery and `alias` is required.
   */
  addSelect(columnOrSubQuery: string | QueryChain<any>, alias?: string): this {
    if (columnOrSubQuery instanceof QueryChain) {
      this.qb.addSelect(
        (qb) => columnOrSubQuery.getQueryBuilder() as unknown as SelectQueryBuilder<any>,
        alias,
      );
    } else if (alias !== undefined) {
      this.qb.addSelect(columnOrSubQuery, alias);
    } else {
      this.qb.addSelect(columnOrSubQuery);
    }
    return this;
  }

  // ─── WHERE (auto-skip) ──────────────────────────────────────────────────────

  where(condition: string, params?: Record<string, unknown>): this {
    if (this.shouldSkip(params)) return this;
    this.qb.where(condition, params);
    return this;
  }

  andWhere(condition: string, params?: Record<string, unknown>): this {
    if (this.shouldSkip(params)) return this;
    this.qb.andWhere(condition, params);
    return this;
  }

  orWhere(condition: string, params?: Record<string, unknown>): this {
    if (this.shouldSkip(params)) return this;
    this.qb.orWhere(condition, params);
    return this;
  }

  // ─── WHERE STRICT (always applied) ──────────────────────────────────────────

  whereStrict(condition: string, params?: Record<string, unknown>): this {
    this.qb.where(condition, params);
    return this;
  }

  andWhereStrict(condition: string, params?: Record<string, unknown>): this {
    this.qb.andWhere(condition, params);
    return this;
  }

  // ─── JOINS ──────────────────────────────────────────────────────────────────

  leftJoin(
    relationOrEntity: string | EntityTarget<any> | QueryChain<any>,
    alias: string,
    condition?: string,
    params?: Record<string, unknown>,
  ): this {
    if (relationOrEntity instanceof QueryChain) {
      this.qb.leftJoin(
        (qb) => relationOrEntity.getQueryBuilder() as unknown as SelectQueryBuilder<any>,
        alias,
        condition,
        params,
      );
    } else if (typeof relationOrEntity === 'string' && condition === undefined) {
      // Simple relation string: e.g. 'user.roles'
      this.qb.leftJoin(relationOrEntity, alias);
    } else if (typeof relationOrEntity === 'string') {
      this.qb.leftJoin(relationOrEntity, alias, condition, params);
    } else {
      this.qb.leftJoin(
        relationOrEntity as ObjectType<any>,
        alias,
        condition,
        params,
      );
    }
    return this;
  }

  leftJoinAndSelect(
    relationOrEntity: string | EntityTarget<any> | QueryChain<any>,
    alias: string,
    condition?: string,
    params?: Record<string, unknown>,
  ): this {
    if (relationOrEntity instanceof QueryChain) {
      this.qb.leftJoinAndSelect(
        (qb) => relationOrEntity.getQueryBuilder() as unknown as SelectQueryBuilder<any>,
        alias,
        condition,
        params,
      );
    } else if (typeof relationOrEntity === 'string' && condition === undefined) {
      this.qb.leftJoinAndSelect(relationOrEntity, alias);
    } else if (typeof relationOrEntity === 'string') {
      this.qb.leftJoinAndSelect(relationOrEntity, alias, condition, params);
    } else {
      this.qb.leftJoinAndSelect(
        relationOrEntity as ObjectType<any>,
        alias,
        condition,
        params,
      );
    }
    return this;
  }

  innerJoin(
    relationOrEntity: string | EntityTarget<any> | QueryChain<any>,
    alias: string,
    condition?: string,
    params?: Record<string, unknown>,
  ): this {
    if (relationOrEntity instanceof QueryChain) {
      this.qb.innerJoin(
        (qb) => relationOrEntity.getQueryBuilder() as unknown as SelectQueryBuilder<any>,
        alias,
        condition,
        params,
      );
    } else if (typeof relationOrEntity === 'string' && condition === undefined) {
      this.qb.innerJoin(relationOrEntity, alias);
    } else if (typeof relationOrEntity === 'string') {
      this.qb.innerJoin(relationOrEntity, alias, condition, params);
    } else {
      this.qb.innerJoin(
        relationOrEntity as ObjectType<any>,
        alias,
        condition,
        params,
      );
    }
    return this;
  }

  // ─── GROUP BY / HAVING ──────────────────────────────────────────────────────

  groupBy(column: string): this {
    this.qb.groupBy(column);
    return this;
  }

  addGroupBy(column: string): this {
    this.qb.addGroupBy(column);
    return this;
  }

  having(condition: string, params?: Record<string, unknown>): this {
    this.qb.having(condition, params);
    return this;
  }

  andHaving(condition: string, params?: Record<string, unknown>): this {
    this.qb.andHaving(condition, params);
    return this;
  }

  // ─── ORDER BY ───────────────────────────────────────────────────────────────

  orderBy(column: string, direction?: 'ASC' | 'DESC'): this {
    this.qb.orderBy(column, direction ?? 'ASC');
    return this;
  }

  addOrderBy(column: string, direction?: 'ASC' | 'DESC'): this {
    this.qb.addOrderBy(column, direction ?? 'ASC');
    return this;
  }

  /**
   * Applies ORDER BY from a list of SortInput objects filtered through a
   * whitelist.  Unknown fields are silently ignored.
   *
   * @param sorts     One or more sort descriptors from the client.
   * @param whitelist Maps field names → SQL column expressions.
   * @param options   Optional default sort when no valid sort is resolved.
   */
  orderByMany(
    sorts: SortInput | SortInput[] | undefined | null,
    whitelist: SortWhitelist,
    options?: OrderByManyOptions,
  ): this {
    const list: SortInput[] = sorts == null ? [] : Array.isArray(sorts) ? sorts : [sorts];

    const valid = list.filter((s) => s.sortField && whitelist[s.sortField] !== undefined);

    if (valid.length === 0) {
      if (options?.default) {
        this.qb.orderBy(options.default[0], options.default[1]);
      }
      return this;
    }

    const [first, ...rest] = valid;
    this.qb.orderBy(whitelist[first.sortField!], first.sortType ?? 'ASC');
    for (const s of rest) {
      this.qb.addOrderBy(whitelist[s.sortField!], s.sortType ?? 'ASC');
    }
    return this;
  }

  // ─── PAGINATION ─────────────────────────────────────────────────────────────

  paginate(pagination?: PaginationInput): this {
    if (pagination === undefined || pagination === null) return this;
    const current = pagination.current ?? 1;
    const pageSize = pagination.pageSize ?? 10;
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

  // ─── EXECUTION ──────────────────────────────────────────────────────────────

  async getMany(): Promise<T[]> {
    return this.qb.getMany();
  }

  async getManyAndCount(): Promise<[T[], number]> {
    return this.qb.getManyAndCount();
  }

  async getOne(): Promise<T | null> {
    return this.qb.getOne();
  }

  async getRawMany<R = any>(): Promise<R[]> {
    return this.qb.getRawMany<R>();
  }

  /**
   * Runs getRawMany and getCount in parallel for efficiency.
   */
  async getRawManyAndCount<R = any>(): Promise<[R[], number]> {
    return Promise.all([this.qb.getRawMany<R>(), this.qb.getCount()]);
  }

  async getRawOne<R = any>(): Promise<R | null> {
    return this.qb.getRawOne<R>() as Promise<R | null>;
  }

  async getCount(): Promise<number> {
    return this.qb.getCount();
  }

  // ─── ESCAPE HATCH ───────────────────────────────────────────────────────────

  getQueryBuilder(): SelectQueryBuilder<T> {
    return this.qb;
  }

  getQuery(): string {
    return this.qb.getQuery();
  }
}
