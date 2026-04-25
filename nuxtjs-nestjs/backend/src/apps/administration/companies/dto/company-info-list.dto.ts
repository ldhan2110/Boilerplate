import { ApiProperty } from '@nestjs/swagger';
import { CompanyInfoDto } from './company-info.dto';

export class CompanyInfoListDto {
  @ApiProperty({ type: [CompanyInfoDto] })
  companyInfo: CompanyInfoDto[];

  @ApiProperty()
  total: number;
}
