import { IsOptional, IsString } from 'class-validator';
import { SearchBaseDto } from '@infra/common/dto';

export class SearchCompanyDto extends SearchBaseDto {
  @IsOptional()
  @IsString()
  coNm?: string;

  @IsOptional()
  @IsString()
  taxCd?: string;

  @IsOptional()
  @IsString()
  coTpCd?: string;

  @IsOptional()
  @IsString()
  coNtn?: string;
}
