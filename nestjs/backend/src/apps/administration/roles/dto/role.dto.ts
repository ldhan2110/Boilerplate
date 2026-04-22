import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { RoleAuthDto } from './role-auth.dto';
import { BaseDto } from '@infra/common/dtos';

export class RoleDto extends BaseDto {
  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  roleCd?: string;

  @IsOptional()
  @IsString()
  roleNm?: string;

  @IsOptional()
  @IsString()
  roleDesc?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoleAuthDto)
  roleAuthList?: RoleAuthDto[];
}
