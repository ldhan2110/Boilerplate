package com.clt.hrm.core.administration.program.dtos;

import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;

import lombok.Data;

@Data
public class SearchProgramDto {
	private String coId;
	private String pgmId;
	private String pgmCd;
    private String pgmNm;
    private String pgmTpCd;
    private String useFlg;
    
    // Pagination & Sorting
    private SortDto sort;
    private PaginationDto pagination;
}

