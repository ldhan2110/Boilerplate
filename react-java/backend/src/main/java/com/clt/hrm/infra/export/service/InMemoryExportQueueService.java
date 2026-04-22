package com.clt.hrm.infra.export.service;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.clt.hrm.infra.exceptions.exception.ExcelExportException;
import com.clt.hrm.infra.export.events.ExportRequestedEvent;
import com.clt.hrm.infra.export.interfaces.IExportQueueService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@ConditionalOnProperty(name = "excel.export.queue.type", havingValue = "memory", matchIfMissing = true)
public class InMemoryExportQueueService implements IExportQueueService {
	private final BlockingQueue<ExportRequestedEvent<?, ?>> exportQueue = new LinkedBlockingQueue<>();

	@Override
	public <T, F> void enqueue(ExportRequestedEvent<T, F> event) {
		try {
            exportQueue.put(event);
            log.info("[InMemoryExportQueueService] ✓ Job {} added to queue. Queue size: {}", event.getJobId(), exportQueue.size());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("[InMemoryExportQueueService] ✗ Failed to add job {} to queue", event.getJobId());
            throw new ExcelExportException("Failed to add job to queue", e);
        }
	}

	@Override
	public ExportRequestedEvent<?, ?> poll(long timeout, TimeUnit unit) throws InterruptedException {
		ExportRequestedEvent<?, ?> event = exportQueue.poll(timeout, unit);
		if (event != null) {
			log.info("[InMemoryExportQueueService] → Job {} removed from queue. Remaining: {}", event.getJobId(), exportQueue.size());
		}
		return event;
	}

	@Override
	public boolean removeFromQueue(String coId, String jobId) {
		boolean removed = exportQueue.removeIf(event -> event.getCoId().equals(coId) && event.getJobId().equals(jobId));
		if (removed) {
			log.info("[InMemoryExportQueueService] ✓ Job {} removed from queue. Queue size: {}", jobId, exportQueue.size());
		} else {
			log.warn("[InMemoryExportQueueService] ✗ Job {} not found in queue", jobId);
		}
		return removed;
	}

	@Override
	public int getQueueSize() {
		return exportQueue.size();
	}

	@Override
	public boolean isInQueue(String coId, String jobId) {
		return exportQueue.stream().anyMatch(event -> event.getCoId().equals(coId) && event.getJobId().equals(jobId));
	}
}
