package com.clt.hrm.core.administration.company.dtos;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import com.fasterxml.jackson.annotation.JsonAlias;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = false)
public class SearchCompanyDto extends SearchBaseDto {
    @JsonAlias("coNm")
    private String searchText;
    private String useFlg;
    private String taxCd;
    private String coTpCd;
    private String coNtn;
}

