package com.clt.hrm.core.common.code.dtos;

import lombok.Data;

import java.util.List;

import com.clt.hrm.infra.common.dtos.DynamicFilterDto;
import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;

@Data
public class SearchMasterCodeDto {
	private String coId;
	private String mstCd;
	private String mstNm;
	private String mstMdlNm;
	private String useFlg;
	
	// Dynamic Filter
	List<DynamicFilterDto> filters;
	
	// Pagination & Sorting
	private SortDto sort;
	private PaginationDto pagination;
}

