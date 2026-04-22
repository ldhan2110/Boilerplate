package com.clt.hrm.core.administration.company.interfaces;

import com.clt.hrm.core.administration.company.dtos.CompanyInfoDto;
import com.clt.hrm.core.administration.company.dtos.CompanyInfoListDto;
import com.clt.hrm.core.administration.company.dtos.SearchCompanyDto;

public interface IAdmCompanyService {
	CompanyInfoListDto getListCompanyInfo(SearchCompanyDto request);
	CompanyInfoDto getCompanyInfo(SearchCompanyDto request);
	boolean checkUniqueTaxCode(SearchCompanyDto request);
	boolean checkUniqueCompanyCode(SearchCompanyDto request);
	void createCompany(CompanyInfoDto request);
	void updateCompany(CompanyInfoDto request);
}
