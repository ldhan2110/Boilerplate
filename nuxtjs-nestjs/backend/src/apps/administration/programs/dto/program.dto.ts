import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionDto } from './permission.dto';
import { BaseDto } from '@infra/common/dto';

export class ProgramDto extends BaseDto {
  @IsOptional()
  @IsString()
  pgmId?: string;

  @IsOptional()
  @IsString()
  pgmCd?: string;

  @IsOptional()
  @IsString()
  pgmNm?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MENU', 'UI'])
  pgmTpCd?: string;

  @IsOptional()
  @IsString()
  prntPgmId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  dspOrder?: number;

  @IsOptional()
  @IsString()
  pgmRmk?: string;

  // Computed tree fields (read-only, populated from CTE)
  @ApiPropertyOptional()
  level?: number;

  @ApiPropertyOptional()
  treeKey?: string;

  @ApiPropertyOptional()
  treePath?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PermissionDto)
  permList?: PermissionDto[];
}
