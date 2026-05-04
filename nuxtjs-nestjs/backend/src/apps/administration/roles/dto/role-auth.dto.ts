import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { BaseDto } from '@infra/common/dto';

export class RoleAuthDto extends BaseDto {
  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  pgmId?: string;

  @IsOptional()
  @IsString()
  permId?: string;

  @IsOptional()
  @IsString()
  pgmCd?: string;

  @IsOptional()
  @IsString()
  pgmTpCd?: string;

  @IsOptional()
  @IsString()
  permCd?: string;
}
