package com.clt.hrm.infra.batchjob.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.clt.hrm.infra.common.dtos.SortDto;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class SearchBatchJobConfigDto extends BaseDto {

	/**
	 * 
	 */
	private static final long serialVersionUID = -6047198411023376309L;
	private String batJbId;
	private String batJbNm;
	
	// Sort
	private SortDto sort;
}
