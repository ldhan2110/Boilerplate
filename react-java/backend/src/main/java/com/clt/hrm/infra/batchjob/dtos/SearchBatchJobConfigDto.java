package com.clt.hrm.infra.batchjob.dtos;

import com.clt.hrm.infra.common.dtos.SearchBaseDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper=false)
public class SearchBatchJobConfigDto extends SearchBaseDto {
	private String batJbId;
	private String batJbNm;
}
