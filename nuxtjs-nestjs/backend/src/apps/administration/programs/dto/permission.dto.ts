import { IsIn, IsOptional, IsString } from 'class-validator';
import { BaseDto } from '@infra/common/dto';

export class PermissionDto extends BaseDto {
  @IsOptional()
  @IsString()
  permId?: string;

  @IsOptional()
  @IsString()
  permCd?: string;

  @IsOptional()
  @IsString()
  permNm?: string;

  @IsOptional()
  @IsString()
  pgmId?: string;
}
