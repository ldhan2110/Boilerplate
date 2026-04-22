package com.clt.hrm.infra.export.service;

import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.TimeUnit;

import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.clt.hrm.infra.exceptions.exception.ExcelExportException;
import com.clt.hrm.infra.export.constants.ExportJobStatus;
import com.clt.hrm.infra.export.dtos.ExportJobDto;
import com.clt.hrm.infra.export.events.ExportRequestedEvent;
import com.clt.hrm.infra.export.interfaces.IExcelExportService;
import com.clt.hrm.infra.export.interfaces.IExportQueueService;
import com.clt.hrm.infra.export.mapper.ExportMapper;
import com.clt.hrm.infra.file.constants.FilePathConstants;
import com.clt.hrm.infra.file.dtos.FileDto;
import com.clt.hrm.infra.file.service.FileService;
import com.clt.hrm.tenant.TenantContext;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ExportWorkerService {
	@Value("${excel.export.temp-directory}")
	private String TMP_DIR;

	@Value("${excel.export.worker.count:2}")
	private int WORKER_COUNT;

	@Autowired
	private IExportQueueService queueService;

	@Autowired
	private ExportMapper exportMapper;

	@Autowired
	private FileService fileService;

	// Flag to control worker lifecycle
	private volatile boolean running = true;

	/**
	 * STEP 1: Start workers when application is ready This runs automatically after
	 * Spring Boot starts
	 */
	@EventListener(ApplicationReadyEvent.class)
	public void startWorkers() {
		log.info("╔════════════════════════════════════════════╗");
		log.info("║  Starting {} Export Worker Threads        ║", WORKER_COUNT);
		log.info("╚════════════════════════════════════════════╝");
		for (int i = 0; i < WORKER_COUNT; i++) {
			startWorker(i);
		}
	}

	/**
	 * STEP 2: Each worker runs in its own thread
	 * 
	 * @Async makes this run in the thread pool
	 */
	@Async("exportTaskExecutor")
	public void startWorker(int workerId) {
		log.info("✓ Worker-{} STARTED and waiting for jobs...", workerId);

		// Infinite loop - worker keeps running
		while (running) {
			try {
				// BLOCKING CALL - waits up to 5 seconds for a job
				ExportRequestedEvent<?, ?> event = queueService.poll(5, TimeUnit.SECONDS);
				if (event != null) {
					log.info("→ Worker-{} picked up job: {}", workerId, event.getJobId());
					// Process the export
					processExport(event, workerId);
					log.info("✓ Worker-{} completed job: {}", workerId, event.getJobId());
				} else {
					// No job available, loop continues (will wait again)
					// This is NOT busy-waiting because poll() blocks
				}

			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
				log.warn("✗ Worker-{} was interrupted", workerId);
				break;
			} catch (Exception e) {
				log.error("✗ Worker-{} encountered error: {}", workerId, e.getMessage(), e);
				// Continue to next iteration - don't stop the worker
			}
		}

		log.info("✓ Worker-{} STOPPED", workerId);
	}

	/**
	 * STEP 3: Process the actual export This is the code that was in your
	 * old @EventListener method
	 */
	private <T, F> void processExport(ExportRequestedEvent<T, F> event, int workerId) {
		String coId = event.getCoId();
		String jobId = event.getJobId();

		try {
			log.info("  Worker-{}: Starting export for job {}", workerId, jobId);

			// Validate coId and jobId
			if (coId == null || jobId == null) {
				log.warn("  Worker-{}: coId or jobId is null, skipping", workerId);
				return;
			}

			// Set tenant context
			TenantContext.setTenant(coId);

			// 1. Verify job still exists and is in correct status
			ExportJobDto job = exportMapper.findJobByJobId(coId, jobId);
			if (job == null) {
				log.warn("  Worker-{}: Job {} not found in database, skipping", workerId, jobId);
				return;
			}

			if (!ExportJobStatus.QUEUED.getValue().equals(job.getJbSts())) {
				log.warn("  Worker-{}: Job {} has status {}, expected QUEUED, skipping", workerId, jobId,job.getJbSts());
				return;
			}

			// 2. Update status to PROCESSING
			log.info("  Worker-{}: Updating job {} to PROCESSING", workerId, jobId);
			updateStatus(coId, jobId, ExportJobStatus.PROCESSING.getValue());

			// 3. Create temp directory if needed
			File tempDir = new File(TMP_DIR);
			if (!tempDir.exists()) {
				tempDir.mkdirs();
				log.info("  Worker-{}: Created temp directory: {}", workerId, TMP_DIR);
			}

			File tempFile = new File(tempDir, event.getFileNm() + ".xlsx");
			log.info("  Worker-{}: Creating Excel file: {}", workerId, tempFile.getName());

			// 4. Create the Excel file (this is the heavy work)
			try (Workbook workbook = new SXSSFWorkbook(1000); FileOutputStream out = new FileOutputStream(tempFile)) {

				// Get the export service from the event
				IExcelExportService<T, F> service = event.getExportService();

				// Call the actual export logic
				// This is where YOUR business logic runs
				service.writeExcelData(workbook, event.getFilter(), job);

				// Write to file
				workbook.write(out);
				log.info("  Worker-{}: Excel file written successfully", workerId);
			}

			// 5. Save file to your file storage system
			log.info("  Worker-{}: Saving file to storage", workerId);
			FileDto file = fileService.saveFile(tempFile, coId, event.getRqstUsrId(), FilePathConstants.EXPORTS);
			// 6. Update job status to COMPLETED
			updateTaskCompleted(coId, jobId, file);
			log.info("  Worker-{}: ✓ Job {} COMPLETED successfully", workerId, jobId);

		} catch (Exception e) {
			log.error("  Worker-{}: ✗ Job {} FAILED: {}", workerId, jobId, e.getMessage(), e);

			// Truncate error message to fit database
			String msg = e.getMessage();
			if (msg != null) {
				msg = msg.length() > 255 ? msg.substring(0, 255) : msg;
			} else {
				msg = "Unknown error";
			}
			updateTaskFailed(coId, jobId, msg);
		} finally {
			TenantContext.clear();
		}
	}

	/**
	 * Update job status to PROCESSING
	 */
	private void updateStatus(String coId, String jobId, String status) {
		ExportJobDto job = exportMapper.findJobByJobId(coId, jobId);
		if (job == null) {
			throw new ExcelExportException("[ExportWorkerService] Job not found: " + jobId);
		}
		job.setJbSts(status);
		exportMapper.updateJobStatus(job);
	}

	/**
	 * Update job status to COMPLETED with file reference
	 */
	private void updateTaskCompleted(String coId, String jobId, FileDto file) {
		ExportJobDto job = exportMapper.findJobByJobId(coId, jobId);
		if (job == null) {
			throw new ExcelExportException("[ExportWorkerService] Job not found: " + jobId);
		}
		job.setJbSts(ExportJobStatus.COMPLETED.getValue());
		job.setFileId(file.getFileId());
		exportMapper.updateJobStatus(job);
	}

	/**
	 * Update job status to FAILED with error message
	 */
	private void updateTaskFailed(String coId, String jobId, String errorMessage) {
		ExportJobDto job = exportMapper.findJobByJobId(coId, jobId);
		if (job == null) {
			throw new ExcelExportException("[ExportWorkerService] Job not found: " + jobId);
		}
		job.setJbSts(ExportJobStatus.FAILED.getValue());
		job.setErrMsg(errorMessage);
		exportMapper.updateJobStatus(job);
	}

	/**
	 * STEP 4: Graceful shutdown when application stops This ensures workers finish
	 * their current job before stopping
	 */
	@PreDestroy
	public void shutdown() {
		log.info("╔════════════════════════════════════════════╗");
		log.info("║  Shutting down Export Workers...          ║");
		log.info("╚════════════════════════════════════════════╝");
		running = false; // Signal workers to stop
		log.info("✓ Workers will stop after completing current jobs");
	}

}
