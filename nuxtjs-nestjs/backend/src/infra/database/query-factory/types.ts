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
