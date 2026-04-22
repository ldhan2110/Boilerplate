package com.clt.hrm.infra.batchjob.dtos;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BatchJobExecutionHistoryListDto {
	List<BatchJobExecutionHistoryDto> executionHistory;
	int total;
}
