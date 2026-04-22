package com.clt.hrm.infra.export.interfaces;

import java.util.concurrent.TimeUnit;

import com.clt.hrm.infra.export.events.ExportRequestedEvent;

public interface IExportQueueService {
	/**
	 * Add job to queue
	 * 
	 * @param event Export job event to enqueue
	 * @throws com.clt.hrm.infra.exceptions.exception.com.exceptions.ExcelExportException if enqueue fails
	 */
	<T, F> void enqueue(ExportRequestedEvent<T, F> event);

	/**
	 * Get next job from queue with timeout
	 * 
	 * @param timeout Maximum time to wait
	 * @param unit    Time unit for timeout
	 * @return Next export job event, or null if timeout reached
	 * @throws InterruptedException if thread is interrupted while waiting
	 */
	ExportRequestedEvent<?, ?> poll(long timeout, TimeUnit unit) throws InterruptedException;

	/**
	 * Remove specific job from queue
	 * 
	 * @param coId  Company ID
	 * @param jobId Job ID to remove
	 * @return true if job was found and removed, false otherwise
	 */
	boolean removeFromQueue(String coId, String jobId);

	/**
	 * Get current queue size
	 * 
	 * @return Number of jobs in queue
	 */
	int getQueueSize();

	/**
	 * Check if specific job is in queue
	 * 
	 * @param coId  Company ID
	 * @param jobId Job ID to check
	 * @return true if job is in queue, false otherwise
	 */
	boolean isInQueue(String coId, String jobId);
}
