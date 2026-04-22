import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from './pagination.dto';
import { SortDto } from './sort.dto';
import { DynamicFilterDto } from './dynamic-filter.dto';
import { BaseDto } from './base.dto';

export class SearchBaseDto extends BaseDto {
  @IsOptional()
  @IsString()
  searchText?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaginationDto)
  pagination?: PaginationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SortDto)
  sort?: SortDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortDto)
  sorts?: SortDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DynamicFilterDto)
  filters?: DynamicFilterDto[];
}
