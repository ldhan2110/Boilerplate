package com.clt.hrm.core.administration.company.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.clt.hrm.core.administration.company.dtos.CompanyInfoDto;
import com.clt.hrm.core.administration.company.dtos.SearchCompanyDto;

import java.util.List;

@Mapper
public interface AdmCompanyMapper {
	List<CompanyInfoDto> searchCompanyList(SearchCompanyDto request);
	CompanyInfoDto selectCompanyInfo(SearchCompanyDto request);
	CompanyInfoDto selectCompanyById(String coId);
	CompanyInfoDto selectCompanyByTaxCd(String taxCd, String excludeCoId);
	int countCompanyList(SearchCompanyDto request);
	void insertCompany(CompanyInfoDto request);
	void updateCompany(CompanyInfoDto request);
}

