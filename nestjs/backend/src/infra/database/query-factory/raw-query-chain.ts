import { DataSource } from 'typeorm';
import type { PaginationInput, SortInput } from './types';
import type { SortWhitelist, OrderByManyOptions } from './query-chain';

interface WhereClause {
  condition: string;
  params: Record<string, unknown>;
  connector: 'AND' | 'OR';
}

interface OrderByClause {
  column: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Fluent builder for raw SQL queries executed via DataSource.query().
 *
 * The `baseSql` is wrapped in an outer SELECT so that WHERE, ORDER BY, and
 * LIMIT/OFFSET can be applied uniformly after any arbitrary subquery.
 *
 * Named parameters (`:paramName`) are converted to positional `$N` placeholders
 * that match the PostgreSQL driver expectation.
 */
export class RawQueryChain<T = any> {
  private readonly dataSource: DataSource;
  private readonly baseSql: string;

  private readonly whereClauses: WhereClause[] = [];
  private readonly orderByClauses: OrderByClause[] = [];
  private paginationInput: PaginationInput | undefined;

  constructor(dataSource: DataSource, baseSql: string) {
    this.dataSource = dataSource;
    this.baseSql = baseSql;
  }

  // ─── Internals ──────────────────────────────────────────────────────────────

  /**
   * Returns true when at least one value in `params` is null or undefined,
   * or when `params` itself is null / undefined.
   */
  shouldSkip(params?: Record<string, unknown>): boolean {
    if (params === null || params === undefined) {
      return false;
    }
    return Object.values(params).some((v) => v === null || v === undefined);
  }

  // ─── WHERE (auto-skip) ──────────────────────────────────────────────────────

  where(condition: string, params: Record<string, unknown> = {}): this {
    if (this.shouldSkip(params)) return this;
    // Replace any existing WHERE clauses by clearing and re-adding as first
    this.whereClauses.length = 0;
    this.whereClauses.push({ condition, params, connector: 'AND' });
    return this;
  }

  andWhere(condition: string, params: Record<string, unknown> = {}): this {
    if (this.shouldSkip(params)) return this;
    this.whereClauses.push({ condition, params, connector: 'AND' });
    return this;
  }

  orWhere(condition: string, params: Record<string, unknown> = {}): this {
    if (this.shouldSkip(params)) return this;
    this.whereClauses.push({ condition, params, connector: 'OR' });
    return this;
  }

  // ─── ORDER BY ───────────────────────────────────────────────────────────────

  orderBy(column: string, direction?: 'ASC' | 'DESC'): this {
    this.orderByClauses.length = 0;
    this.orderByClauses.push({ column, direction: direction ?? 'ASC' });
    return this;
  }

  addOrderBy(column: string, direction?: 'ASC' | 'DESC'): this {
    this.orderByClauses.push({ column, direction: direction ?? 'ASC' });
    return this;
  }

  orderByMany(
    sorts: SortInput | SortInput[] | undefined | null,
    whitelist: SortWhitelist,
    options?: OrderByManyOptions,
  ): this {
    const list: SortInput[] = sorts == null ? [] : Array.isArray(sorts) ? sorts : [sorts];

    const valid = list.filter((s) => s.sortField && whitelist[s.sortField] !== undefined);

    this.orderByClauses.length = 0;

    if (valid.length === 0) {
      if (options?.default) {
        this.orderByClauses.push({
          column: options.default[0],
          direction: options.default[1],
        });
      }
      return this;
    }

    for (const s of valid) {
      this.orderByClauses.push({
        column: whitelist[s.sortField!],
        direction: s.sortType ?? 'ASC',
      });
    }
    return this;
  }

  // ─── PAGINATION ─────────────────────────────────────────────────────────────

  paginate(pagination?: PaginationInput): this {
    this.paginationInput = pagination;
    return this;
  }

  // ─── SQL ASSEMBLY ────────────────────────────────────────────────────────────

  /**
   * Assembles the full SQL string and collects positional parameter values.
   *
   * @param withCount When true, adds `COUNT(*) OVER() AS "__total"` to the
   *                  outer SELECT so a single query returns both rows and total.
   */
  buildSql(withCount: boolean): { sql: string; values: unknown[] } {
    const values: unknown[] = [];
    let paramIndex = 1;

    // ── Outer SELECT ──────────────────────────────────────────────────────────
    const outerSelect = withCount
      ? `SELECT *, COUNT(*) OVER() AS "__total"`
      : `SELECT *`;

    let sql = `${outerSelect} FROM (${this.baseSql}) AS "__raw"`;

    // ── WHERE ─────────────────────────────────────────────────────────────────
    if (this.whereClauses.length > 0) {
      const whereParts = this.whereClauses.map((clause, idx) => {
        // Replace named :param placeholders with $N positional ones
        let condition = clause.condition;
        for (const [key, value] of Object.entries(clause.params)) {
          const namedPattern = new RegExp(`:${key}\\b`, 'g');
          if (namedPattern.test(condition)) {
            condition = condition.replace(new RegExp(`:${key}\\b`, 'g'), `$${paramIndex}`);
            values.push(value);
            paramIndex++;
          }
        }
        const prefix = idx === 0 ? '' : ` ${clause.connector} `;
        return `${prefix}(${condition})`;
      });
      sql += ` WHERE ${whereParts.join('')}`;
    }

    // ── ORDER BY ──────────────────────────────────────────────────────────────
    if (this.orderByClauses.length > 0) {
      const orderParts = this.orderByClauses.map(
        (o) => `${o.column} ${o.direction}`,
      );
      sql += ` ORDER BY ${orderParts.join(', ')}`;
    }

    // ── LIMIT / OFFSET ────────────────────────────────────────────────────────
    if (this.paginationInput !== undefined && this.paginationInput !== null) {
      const current = this.paginationInput.current ?? 1;
      const pageSize = this.paginationInput.pageSize ?? 10;
      const offset = (current - 1) * pageSize;
      sql += ` LIMIT $${paramIndex}`;
      values.push(pageSize);
      paramIndex++;
      sql += ` OFFSET $${paramIndex}`;
      values.push(offset);
      paramIndex++;
    }

    return { sql, values };
  }

  // ─── EXECUTION ──────────────────────────────────────────────────────────────

  async execute(): Promise<T[]> {
    const { sql, values } = this.buildSql(false);
    return this.dataSource.query<T[]>(sql, values);
  }

  /**
   * Executes with `COUNT(*) OVER()` to retrieve total count alongside rows in
   * a single round-trip.  Strips the `__total` column from each returned row.
   */
  async executeAndCount(): Promise<[T[], number]> {
    const { sql, values } = this.buildSql(true);
    const rows: (T & { __total?: string })[] = await this.dataSource.query(sql, values);

    if (rows.length === 0) {
      return [[], 0];
    }

    const total = parseInt(rows[0].__total ?? '0', 10);

    const clean = rows.map((row) => {
      const { __total, ...rest } = row as any;
      return rest as T;
    });

    return [clean, total];
  }

  async executeOne(): Promise<T | null> {
    const rows = await this.execute();
    return rows.length > 0 ? rows[0] : null;
  }
}
