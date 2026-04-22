package com.clt.hrm.infra.exceptions.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class SearchExceptionLogDto extends BaseDto{
	/**
	 * 
	 */
	private static final long serialVersionUID = 9028038914829199899L;
	private String dateFm;
	private String dateTo;
	private String endPoint;
	
	// Pagination & Sorting
    private SortDto sort;
    private PaginationDto pagination;
}
