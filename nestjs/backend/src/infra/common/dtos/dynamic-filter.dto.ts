import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export enum FilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  LIKE = 'LIKE',
  IN = 'IN',
  BETWEEN = 'BETWEEN',
}

export enum FilterValueType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
}

export class DynamicFilterDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_]+$/, { message: 'field must be alphanumeric with underscores only' })
  field: string;

  @IsEnum(FilterOperator)
  operator: FilterOperator;

  @IsOptional()
  value?: string;

  @IsOptional()
  valueTo?: string;

  @IsOptional()
  @IsEnum(FilterValueType)
  valueType?: FilterValueType;
}
