import { IsIn, IsOptional, Matches } from 'class-validator';

export class SortDto {
  @IsOptional()
  @Matches(/^[A-Za-z0-9_]+$/, { message: 'sortField must be alphanumeric with underscores only' })
  sortField?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortType?: 'ASC' | 'DESC';
}
