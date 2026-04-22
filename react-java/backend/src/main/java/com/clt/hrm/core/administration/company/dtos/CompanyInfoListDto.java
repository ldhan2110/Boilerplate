package com.clt.hrm.core.administration.company.dtos;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompanyInfoListDto {
	List<CompanyInfoDto> companyInfo;
	int total;
}

