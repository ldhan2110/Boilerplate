import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SuccessDto } from '@infra/common/dto';
import { CompaniesService } from './companies.service';
import { CompanyInfoDto, CompanyInfoListDto, SearchCompanyDto } from './dto';

@Controller('/adm/company')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post('getListCompanyInfo')
  @HttpCode(HttpStatus.OK)
  getListCompanyInfo(@Body() dto: SearchCompanyDto): Promise<CompanyInfoListDto> {
    return this.companiesService.getListCompanyInfo(dto);
  }

  @Post('getCompanyInfo')
  @HttpCode(HttpStatus.OK)
  getCompanyInfo(@Body() dto: SearchCompanyDto): Promise<CompanyInfoDto | null> {
    return this.companiesService.getCompanyInfo(dto);
  }

  @Post('createCompany')
  @HttpCode(HttpStatus.OK)
  async createCompany(@Body() dto: CompanyInfoDto): Promise<SuccessDto> {
    await this.companiesService.createCompany(dto);
    return SuccessDto.of(true);
  }

  @Post('updateCompany')
  @HttpCode(HttpStatus.OK)
  async updateCompany(@Body() dto: CompanyInfoDto): Promise<SuccessDto> {
    await this.companiesService.updateCompany(dto);
    return SuccessDto.of(true);
  }
}
