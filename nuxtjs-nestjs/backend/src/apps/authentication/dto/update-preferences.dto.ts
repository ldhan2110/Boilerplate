import { BaseDto } from '@infra/common/dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePreferencesDto extends BaseDto {
  @IsOptional()
  @IsString()
  langVal?: string;

  @IsOptional()
  @IsString()
  sysModVal?: string;

  @IsOptional()
  @IsString()
  dtFmtVal?: string;

  @IsOptional()
  @IsString()
  sysColrVal?: string;
}
