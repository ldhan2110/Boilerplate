import { IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize: number = 10;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  current: number = 1;
}
