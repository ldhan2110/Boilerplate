import { IsOptional, IsString } from 'class-validator';
import { BaseDto } from '@infra/common/dtos';

export class CompanyInfoDto extends BaseDto {
  @IsOptional()
  @IsString()
  coNm?: string;

  @IsOptional()
  @IsString()
  coTpCd?: string;

  @IsOptional()
  @IsString()
  coFrgnNm?: string;

  @IsOptional()
  @IsString()
  taxCd?: string;

  @IsOptional()
  @IsString()
  taxOfc?: string;

  @IsOptional()
  @IsString()
  coLoclNm?: string;

  @IsOptional()
  @IsString()
  coAddrVal1?: string;

  @IsOptional()
  @IsString()
  coAddrVal2?: string;

  @IsOptional()
  @IsString()
  coAddrVal3?: string;

  @IsOptional()
  @IsString()
  emlAddr?: string;

  @IsOptional()
  @IsString()
  faxNo?: string;

  @IsOptional()
  @IsString()
  phnNo?: string;

  @IsOptional()
  @IsString()
  slRep?: string;

  @IsOptional()
  @IsString()
  webAddr?: string;

  @IsOptional()
  @IsString()
  coDesc?: string;

  @IsOptional()
  @IsString()
  coAnvDt?: string;

  @IsOptional()
  @IsString()
  coSz?: string;

  @IsOptional()
  @IsString()
  coNtn?: string;

  @IsOptional()
  @IsString()
  empeSz?: string;

  @IsOptional()
  @IsString()
  currCd?: string;

  @IsOptional()
  @IsString()
  coIndusZn?: string;

  @IsOptional()
  @IsString()
  coProd?: string;

  @IsOptional()
  @IsString()
  tmZn?: string;

  @IsOptional()
  @IsString()
  bankTpCd?: string;

  @IsOptional()
  @IsString()
  bankAcctNo?: string;

  @IsOptional()
  @IsString()
  bankNm?: string;

  @IsOptional()
  @IsString()
  chtrCapiVal?: string;

  @IsOptional()
  @IsString()
  estbDt?: string;

  @IsOptional()
  @IsString()
  lgoFileId?: string;
}
