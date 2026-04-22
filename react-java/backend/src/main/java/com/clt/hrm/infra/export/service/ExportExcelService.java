package com.clt.hrm.infra.export.service;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.infra.common.dtos.ExcelExportResultDto;
import com.clt.hrm.infra.exceptions.exception.ExcelExportException;
import com.clt.hrm.infra.export.constants.ExportJobStatus;
import com.clt.hrm.infra.export.dtos.ExportJobDto;
import com.clt.hrm.infra.export.dtos.ExportJobListDto;
import com.clt.hrm.infra.export.dtos.SearchExportJobDto;
import com.clt.hrm.infra.export.events.ExportRequestedEvent;
import com.clt.hrm.infra.export.interfaces.IExcelExportService;
import com.clt.hrm.infra.export.interfaces.IExportQueueService;
import com.clt.hrm.infra.export.mapper.ExportMapper;
import com.clt.hrm.infra.utils.CommonFunction;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ExportExcelService {
	@Value("${excel.export.async-threshold}")
	private int ASYNC_THRESHOLD;

	@Value("${excel.export.temp-directory}")
	private String TMP_DIR;

	@Autowired
	private ExportMapper exportMapper;

	@Autowired
	private IExportQueueService queueService;
	
	private final ConcurrentHashMap<String, ExportRequestedEvent<?, ?>> inMemoryEventCache = new ConcurrentHashMap<>();
	private final ScheduledExecutorService cleanupScheduler = Executors.newSingleThreadScheduledExecutor();

	// Initialize cleanup task in constructor or @PostConstruct - Run cleanup every
	// 5 minutes
	@PostConstruct
	public void init() {
		cleanupScheduler.scheduleAtFixedRate(this::cleanupExpiredEvents, 5, 5, TimeUnit.MINUTES);
	}

	// Cleanup on shutdown
	@PreDestroy
	public void shutdown() {
		cleanupScheduler.shutdown();
		try {
			if (!cleanupScheduler.awaitTermination(5, TimeUnit.SECONDS)) {
				cleanupScheduler.shutdownNow();
			}
		} catch (InterruptedException e) {
			cleanupScheduler.shutdownNow();
			Thread.currentThread().interrupt();
		}
	}

	// Cleanup method
	private void cleanupExpiredEvents() {
		inMemoryEventCache.entrySet().removeIf(entry -> entry.getValue().isExpired());
		log.debug("[ExportExcelService] Cleaned up expired events. Remaining: {}", inMemoryEventCache.size());
	}

	/**
	 * Main export method - automatically handles sync vs async
	 * 
	 * @throws Exception
	 */
	public <T, F> ExcelExportResultDto export(IExcelExportService<T, F> exportService, int count, F filter,
			int threshold, String fileName) throws Exception {
		if (count > threshold) {
			return exportAsync(exportService, filter, fileName, count);
		} else if (count > ASYNC_THRESHOLD) {
			return exportAsync(exportService, filter, fileName, count);
		} else {
			return exportSync(exportService, filter, fileName);
		}
	}

	/**
	 * Synchronous export - small datasets
	 * 
	 * @throws Exception
	 */
	private <T, F> ExcelExportResultDto exportSync(IExcelExportService<T, F> exportService, F filter, String fileName)
			throws Exception {
		try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			exportService.writeExcelData(workbook, filter, null);
			workbook.write(out);
			return ExcelExportResultDto.immediate(out.toByteArray(), fileName);
		} catch (Exception e) {
			log.error("[ExportExcelService][exportSync] Sync export failed", e);
			throw e;
		}
	}

	/**
	 * Asynchronous export - large datasets
	 */
	@Transactional(rollbackFor = Exception.class)
	private <T, F> ExcelExportResultDto exportAsync(IExcelExportService<T, F> exportService, F filter, String fileName,
			long total) {
		try {
			UserInfo usr = CommonFunction.getUserInfo();
			ObjectMapper mapper = new ObjectMapper();
			ExportJobDto job = new ExportJobDto();
			job.setCoId(usr.getCoId());
			job.setJbSts(ExportJobStatus.PENDING_CONFIRMATION.getValue());
			job.setJbRqstPara(mapper.valueToTree(filter));
			job.setTotalRows(total);
			job.setFileNm(fileName + ".xlsx");
			job.setUpdUsrId(usr.getUsrId());
			job.setCreUsrId(usr.getUsrId());
			exportMapper.insertExportJob(job);

			// Create event for later processing
			Instant expiresAt = Instant.now().plus(5, ChronoUnit.MINUTES);
			ExportRequestedEvent<T, F> event = new ExportRequestedEvent<>(job.getCoId(), job.getJbId(), filter, fileName, usr.getUsrId(), expiresAt, exportService);
			storeEventForConfirmation(job.getJbId(), event);

			return ExcelExportResultDto.async(job.getJbId());
		} catch (Exception e) {
			log.error("[ExportExcelService][exportAsync] Sync export failed", e);
			throw e;
		}
	}

	/**
	 * User confirms export - add to processing queue
	 */
	@Transactional(rollbackFor = Exception.class)
	public void confirmExport(String coId, String jobId) {
		ExportJobDto job = exportMapper.findJobByJobId(coId, jobId);
		if (job == null) {
			throw new ExcelExportException("[ExportExcelService][confirmExport] Export job not found");
		}

		if (!ExportJobStatus.PENDING_CONFIRMATION.getValue().equals(job.getJbSts())) {
			throw new ExcelExportException("Job is not in pending confirmation status");
		}

		// Update status to QUEUED
		job.setJbSts(ExportJobStatus.QUEUED.getValue());
		exportMapper.updateJobStatus(job);

		// Retrieve stored event and add to queue
		ExportRequestedEvent<?, ?> event = retrieveEventForConfirmation(jobId);
		if (event != null) {
			TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
				@Override
				public void afterCommit() {
					queueService.enqueue(event);
					log.info("[confirmExport] Job {} added to queue AFTER COMMIT", jobId);
				}
			});
		} else {
			// Update status to QUEUED
			job.setJbSts(ExportJobStatus.FAILED.getValue());
			job.setErrMsg("Event data not found for job " + jobId);
			exportMapper.updateJobStatus(job);
			log.info("[ExportExcelService][confirmExport] Event data not found for job " + jobId);
		}
	}

	/**
	 * User cancels export
	 */
	@Transactional(rollbackFor = Exception.class)
	public void cancelExport(String coId, String jobId) {
		ExportJobDto job = exportMapper.findJobByJobId(coId, jobId);
		if (job == null) {
			throw new ExcelExportException("Export job not found");
		}
		String currentStatus = job.getJbSts();
		// Can only cancel if pending confirmation or queued
		if (ExportJobStatus.PENDING_CONFIRMATION.getValue().equals(currentStatus)) {
			// Just update status
			job.setJbSts(ExportJobStatus.CANCELLED.getValue());
			exportMapper.updateJobStatus(job);
			removeEventForConfirmation(jobId);
			log.info("[ExportExcelService] Job {} cancelled (pending confirmation)", jobId);
		} else if (ExportJobStatus.QUEUED.getValue().equals(currentStatus)) {
			// Try to remove from queue
			boolean removed = queueService.removeFromQueue(coId, jobId);
			if (removed) {
				job.setJbSts(ExportJobStatus.CANCELLED.getValue());
				exportMapper.updateJobStatus(job);
				log.info("[ExportExcelService][cancelExport] Job {} cancelled (removed from queue)", jobId);
			} else {
				throw new ExcelExportException("[ExportExcelService][cancelExport] Job is already being processed");
			}
		} else {
			throw new ExcelExportException("[ExportExcelService][cancelExport] Cannot cancel job in status: " + currentStatus);
		}
	}

	public ExportJobListDto getExportJobList(@Valid SearchExportJobDto request) {
		String usrId = CommonFunction.getUserId();
		request.setCreUsrId(usrId);
		ExportJobListDto result = new ExportJobListDto();
		result.setJobs(exportMapper.getExportJobList(request));
		result.setTotal(exportMapper.countExportJobList(request));
		return result;
	}

	public ExportJobDto getExportJob(@Valid SearchExportJobDto request) {
		return exportMapper.findJobByJobId(request.getCoId(), request.getJbId());
	}

	public void updateProgress(String coId, String jbId, int percent) {
		exportMapper.updateProgress(coId, jbId, percent);
	}

	// ========== Event Storage Methods ==========
	/**
	 * Store event for user confirmation using in-memory cache
	 */
	private void storeEventForConfirmation(String jobId, ExportRequestedEvent<?, ?> event) {
		try {
			// Fallback to in-memory cache
			inMemoryEventCache.put(jobId, event);
			log.debug("[ExportExcelService] Event stored in memory for job {} (expires at {})", jobId, event.getExpiresAt());
		} catch (Exception e) {
			log.error("[ExportExcelService] Failed to store event for job {}", jobId, e);
		}
	}

	/**
	 * Retrieve stored event
	 */
	private ExportRequestedEvent<?, ?> retrieveEventForConfirmation(String jobId) {
		try {
			ExportRequestedEvent<?, ?> cachedEvent = inMemoryEventCache.get(jobId);
			if (cachedEvent != null && !cachedEvent.isExpired()) {
				return cachedEvent;
			} else if (cachedEvent != null) {
				inMemoryEventCache.remove(jobId);
			}
		} catch (Exception e) {
			log.error("[ExportExcelService] Failed to retrieve event for job {}", jobId, e);
		}
		return null;
	}

	/**
	 * Remove stored event
	 */
	private void removeEventForConfirmation(String jobId) {
		try {
			ExportRequestedEvent<?, ?> removed = inMemoryEventCache.remove(jobId);
			if (removed != null) {
				log.debug("[ExportExcelService] Event removed from memory for job {}", jobId);
			} else {
				log.debug("[ExportExcelService] No event found in memory for job {}", jobId);
			}
		} catch (Exception e) {
			log.error("[ExportExcelService] Failed to remove event for job {}", jobId, e);
		}
	}
}
