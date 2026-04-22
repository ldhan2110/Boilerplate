package com.clt.hrm.infra.batchjob.dtos;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class SearchBatchJobExecutionHistoryDto extends SearchBaseDto {
	private String batJbId;
}
