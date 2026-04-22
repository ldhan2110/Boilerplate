package com.clt.hrm.infra.export.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class SearchExportJobDto extends BaseDto {
	/**
	 * 
	 */
	private static final long serialVersionUID = 7001966751459485659L;
	private String jbId;
	private String[] jbIds;
	
	 // Pagination & Sorting
    private SortDto sort;
    private PaginationDto pagination;
}
