package com.clt.hrm.infra.batchjob.service;

import java.time.LocalDate;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.quartz.CronExpression;
import org.quartz.SchedulerException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clt.hrm.infra.batchjob.constants.BatchJobStatus;
import com.clt.hrm.infra.batchjob.dtos.BatchJobConfigDto;
import com.clt.hrm.infra.batchjob.dtos.BatchJobExecutionHistoryDto;
import com.clt.hrm.infra.batchjob.dtos.BatchJobExecutionHistoryListDto;
import com.clt.hrm.infra.batchjob.dtos.SearchBatchJobConfigDto;
import com.clt.hrm.infra.batchjob.dtos.SearchBatchJobExecutionHistoryDto;
import com.clt.hrm.infra.batchjob.mapper.BatchJobMapper;
import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.utils.CommonFunction;
import com.cronutils.descriptor.CronDescriptor;
import com.cronutils.model.CronType;
import com.cronutils.model.definition.CronDefinition;
import com.cronutils.model.definition.CronDefinitionBuilder;
import com.cronutils.parser.CronParser;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class BatchJobService {
	@Autowired
	BatchJobMapper batchMapper;

	@Autowired
	SchedulerService schedulerService;

	public List<BatchJobConfigDto> searchBatchJobConfigList(SearchBatchJobConfigDto request) {
		return batchMapper.searchBatchJobConfigList(request);
	}

	public BatchJobConfigDto getBatchJob(SearchBatchJobConfigDto request) {
		return batchMapper.searchBatchJob(request);
	}

	public BatchJobExecutionHistoryListDto searchBatchJobHistoryList(SearchBatchJobExecutionHistoryDto request) {
		BatchJobExecutionHistoryListDto result = new BatchJobExecutionHistoryListDto();
		result.setExecutionHistory(batchMapper.searchBatchJobHistoryList(request));
		result.setTotal(batchMapper.countBatchJobHistoryList(request));
		return result;
	}

	public Date getNextFiredTime(String jobName, String jobGroup) throws SchedulerException {
		try {
			return schedulerService.getNextRunDate(jobName, jobGroup);
		} catch (SchedulerException ex) {
			log.error("[BatchJobService][getNextFiredTime] Error: {}", ex.getMessage(), ex);
			throw ex;
		}
	}

	public void runJob(BatchJobConfigDto config) throws Exception {
		try {
			// 1. Fetch saved default params from DB
			BatchJobConfigDto savedConfig = batchMapper.getBatchJobConfig(config);

			// 2. Start with saved defaults as base
			Map<String, Object> mergedParams = new HashMap<>();
			if (savedConfig != null && savedConfig.getJobParams() != null) {
				mergedParams.putAll(savedConfig.getJobParams());
			}

			// 3. Overlay with override params from request (takes precedence)
			if (config.getJobParams() != null) {
				mergedParams.putAll(config.getJobParams());
			}

			// 4. Inject runDt if not provided
			if (!mergedParams.containsKey("runDt")) {
				mergedParams.put("runDt", LocalDate.now().toString());
			}

			schedulerService.triggerJob(config.getBatJbId(), config.getCoId(), mergedParams);
		} catch (Exception ex) {
			log.error("[BatchJobService][runJob] Error: {}", ex.getMessage(), ex);
			throw ex;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void insertBatchJobConfig(BatchJobConfigDto config) throws Exception {
		try {
			if (!CronExpression.isValidExpression(config.getCronXprVal())) {
				throw new BizException("SYS000001", "Cron Expression is invalid.", "Cron Expression is invalid.",
						HttpStatus.BAD_REQUEST);
			}
			String usrId = CommonFunction.getUserId();
			config.setBatJbStsCd(BatchJobStatus.PLANNED.toString());
			config.setCronDesc(parseCron(config.getCronXprVal()));
			config.setCreUsrId(usrId);
			config.setUpdUsrId(usrId);
			batchMapper.insertBatchJobConfig(config);
			schedulerService.registerJob(config);
		} catch (Exception ex) {
			log.error("[BatchJobService][insertBatchJobConfig] Error: {}", ex.getMessage(), ex);
			throw ex;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void updateBatchJobConfig(BatchJobConfigDto config) throws Exception {
		try {
			if (!CronExpression.isValidExpression(config.getCronXprVal())) {
				throw new BizException("SYS000001", "Cron Expression is invalid.", "Cron Expression is invalid.",
						HttpStatus.BAD_REQUEST);
			}
			String usrId = CommonFunction.getUserId();
			config.setBatJbStsCd(BatchJobStatus.PLANNED.toString());
			config.setCronDesc(parseCron(config.getCronXprVal()));
			config.setBatJbNxtRunDt(this.getNextFiredTime(config.getBatJbId(), config.getCoId()));
			config.setUpdUsrId(usrId);
			batchMapper.updateBatchConfig(config);
			schedulerService.registerJob(config);
		} catch (Exception ex) {
			log.error("[BatchJobService][insertBatchJobConfig] Error: {}", ex.getMessage(), ex);
			throw ex;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void pauseJob(BatchJobConfigDto config) throws Exception {
		try {
			BatchJobConfigDto existConfig = batchMapper.getBatchJobConfig(config);
			if (existConfig == null) {
				throw new BizException("SYS000002", "Batch Job does not exist.", "Batch Job does not exist.",
						HttpStatus.BAD_REQUEST);
			}
			// Validate current status
			if (BatchJobStatus.PAUSED.toString().equals(existConfig.getBatJbStsCd())) {
				throw new BizException("COM000012", "Batch Job is already paused.",
						"Cannot pause a job that is already paused.", HttpStatus.BAD_REQUEST);
			}
			String usrId = CommonFunction.getUserId();
			config.setBatJbStsCd(BatchJobStatus.PAUSED.toString());
			config.setUpdUsrId(usrId);
			batchMapper.updateBatchConfig(config);
			schedulerService.pauseJob(config.getBatJbId(), config.getCoId());
		} catch (Exception ex) {
			log.error("[BatchJobService][pauseJob] Error: {}", ex.getMessage(), ex);
			throw ex;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void resumeJob(BatchJobConfigDto config) throws Exception {
		try {
			BatchJobConfigDto existConfig = batchMapper.getBatchJobConfig(config);
			if (existConfig == null) {
				throw new BizException("SYS000002", "Batch Job does not exist.", "Batch Job does not exist.",
						HttpStatus.BAD_REQUEST);
			}
			// Validate current status
			if (!BatchJobStatus.PAUSED.toString().equals(existConfig.getBatJbStsCd())) {
				throw new BizException("SYS000003", "Batch Job cannot be resumed.", "Only paused jobs can be resumed.",
						HttpStatus.BAD_REQUEST);
			}

			String usrId = CommonFunction.getUserId();
			config.setBatJbStsCd(BatchJobStatus.PLANNED.toString());
			config.setUpdUsrId(usrId);
			batchMapper.updateBatchConfig(config);
			schedulerService.resumeJob(config.getBatJbId(), config.getCoId());
		} catch (Exception ex) {
			log.error("[BatchJobService][pauseJob] Error: {}", ex.getMessage(), ex);
			throw ex;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void deleteJob(BatchJobConfigDto config) throws Exception {
		try {
			BatchJobConfigDto existConfig = batchMapper.getBatchJobConfig(config);
			if (existConfig == null) {
				throw new BizException("SYS000002", "Batch Job does not exist.", "Batch Job does not exist.",
						HttpStatus.BAD_REQUEST);
			}
			batchMapper.deleteBatchJobConfig(config);
			schedulerService.deleteJob(config.getBatJbId(), config.getCoId());
		} catch (Exception ex) {
			log.error("[BatchJobService][pauseJob] Error: {}", ex.getMessage(), ex);
			throw ex;
		}
	}

	// Parse Cron Expression to human readable
	private String parseCron(String cronExpression) {
		try {
			if (!CronExpression.isValidExpression(cronExpression))
				return "Cron Invalid";
			CronDefinition cronDefinition = CronDefinitionBuilder.instanceDefinitionFor(CronType.QUARTZ);
			CronDescriptor descriptor = CronDescriptor.instance(Locale.US);
			CronParser parser = new CronParser(cronDefinition);
			String description = descriptor.describe(parser.parse(cronExpression));
			return description;
		} catch (Exception a) {
			return "Cron Invalid";
		}
	}

	public void insertBatchJobHistory(BatchJobExecutionHistoryDto execution) {
		batchMapper.insertBatchJobHistory(execution);
	}

	public void updateBatchConfigStatus(BatchJobExecutionHistoryDto execution) {
		batchMapper.updateBatchConfigStatus(execution);
	}

	public void updateBatchJobHistory(BatchJobExecutionHistoryDto execution) {
		batchMapper.updateBatchJobHistory(execution);
	}
}
