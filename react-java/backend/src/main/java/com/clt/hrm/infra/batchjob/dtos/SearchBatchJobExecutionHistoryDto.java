package com.clt.hrm.infra.batchjob.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.clt.hrm.infra.common.dtos.PaginationDto;
import com.clt.hrm.infra.common.dtos.SortDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class SearchBatchJobExecutionHistoryDto extends BaseDto {
	/**
	 * 
	 */
	private static final long serialVersionUID = -5313448687966002847L;

	private String batJbId;
	
	// Sort
	private SortDto sort;
	private PaginationDto pagination;
}
