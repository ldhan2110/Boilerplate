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

    // merge mode
    if (this.mergeDto) {
      if (!this.objectWhere) {
        throw new Error('UpdateChain.merge() requires an object WHERE condition (not a string).');
      }

      const existing = await this.manager.findOne(this.entity, {
        where: this.objectWhere,
      } as any);

      if (!existing) {
        throw new NotFoundException('Entity not found for merge update.');
      }

      const merged = { ...existing };
      for (const [key, value] of Object.entries(this.mergeDto)) {
        if (value !== null && value !== undefined) {
          (merged as any)[key] = value;
        }
      }

      await this.manager.save(this.entity, merged);
      return;
    }

    // set mode with object where
    if (this.objectWhere) {
      await this.manager.update(this.entity, this.objectWhere, this.setData! as any);
      return;
    }

    // set mode with string where
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
