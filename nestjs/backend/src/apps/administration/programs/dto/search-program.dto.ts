import { IsOptional, IsString } from 'class-validator';
import { SearchBaseDto } from '@infra/common/dtos';

export class SearchProgramDto extends SearchBaseDto {
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
  pgmTpCd?: string;
}
