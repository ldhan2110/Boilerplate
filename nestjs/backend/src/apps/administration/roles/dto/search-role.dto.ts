import { IsOptional, IsString } from 'class-validator';
import { SearchBaseDto } from '@infra/common/dtos';

export class SearchRoleDto extends SearchBaseDto {
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
  pgmId?: string;

  @IsOptional()
  @IsString()
  permId?: string;
}
