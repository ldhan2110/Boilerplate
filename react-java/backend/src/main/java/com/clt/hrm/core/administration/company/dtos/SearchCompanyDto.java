package com.clt.hrm.core.administration.company.dtos;

import java.util.List;

import com.clt.hrm.infra.common.dtos.DynamicFilterDto;
import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;
import com.fasterxml.jackson.annotation.JsonAlias;

import lombok.Data;

@Data
public class SearchCompanyDto {
    private String coId;
    @JsonAlias("coNm")
    private String searchText;
    private String useFlg;
    private String taxCd;
    private String coTpCd;
    private String coNtn;
    
    // Dynamic Filter
    List<DynamicFilterDto> filters;
    
    // Pagination & Sorting
    private SortDto sort;
    private PaginationDto pagination;
}

