package com.clt.hrm.infra.batchjob.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import com.clt.hrm.infra.batchjob.dtos.BatchJobConfigDto;
import com.clt.hrm.infra.batchjob.dtos.BatchJobExecutionHistoryDto;
import com.clt.hrm.infra.batchjob.dtos.SearchBatchJobConfigDto;
import com.clt.hrm.infra.batchjob.dtos.SearchBatchJobExecutionHistoryDto;

@Mapper
public interface BatchJobMapper {
	void insertBatchJobConfig(BatchJobConfigDto config);
	BatchJobConfigDto getBatchJobConfig(BatchJobConfigDto config);
	List<BatchJobConfigDto> searchBatchJobConfigList(SearchBatchJobConfigDto request);
	void deleteBatchJobConfig(BatchJobConfigDto config);
	void updateBatchConfig(BatchJobConfigDto config);
	void insertBatchJobHistory(BatchJobExecutionHistoryDto execution);
	void updateBatchJobHistory(BatchJobExecutionHistoryDto execution);
	void updateBatchConfigStatus(BatchJobExecutionHistoryDto execution);
	BatchJobConfigDto searchBatchJob(SearchBatchJobConfigDto request);
	List<BatchJobExecutionHistoryDto> searchBatchJobHistoryList(SearchBatchJobExecutionHistoryDto request);
	int countBatchJobHistoryList(SearchBatchJobExecutionHistoryDto request);
}
