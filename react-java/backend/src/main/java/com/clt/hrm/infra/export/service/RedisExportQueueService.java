package com.clt.hrm.infra.export.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import com.clt.hrm.infra.exceptions.exception.ExcelExportException;
import com.clt.hrm.infra.export.events.ExportRequestedEvent;
import com.clt.hrm.infra.export.events.SerializableExportEvent;
import com.clt.hrm.infra.export.interfaces.IExcelExportService;
import com.clt.hrm.infra.export.interfaces.IExportQueueService;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@ConditionalOnProperty(name = "excel.export.queue.type", havingValue = "redis")
public class RedisExportQueueService implements IExportQueueService {
	
	private static final String QUEUE_KEY = "excel:export:queue";
	private static final String JOB_KEY_PREFIX = "excel:export:job:";
	
	@Autowired
	private RedisTemplate<String, Object> redisTemplate;
	
	@Autowired
	private ObjectMapper objectMapper;
	
	// In-memory cache to store service references AND filters by job key
	private final Map<String, CachedJobData> jobDataCache = new ConcurrentHashMap<>();

	@Override
	public <T, F> void enqueue(ExportRequestedEvent<T, F> event) {
		try {
			String jobKey = getJobKey(event.getCoId(), event.getJobId());
			
			// Store the service and filter in memory (these can't be serialized)
			jobDataCache.put(jobKey, new CachedJobData(event.getExportService(), event.getFilter()));
			

			// Create a serializable DTO without the service and filter
			SerializableExportEvent dto = new SerializableExportEvent();
			dto.setCoId(event.getCoId());
			dto.setJobId(event.getJobId());
			dto.setFileNm(event.getFileNm());
			dto.setRqstUsrId(event.getRqstUsrId());
			dto.setExpiresAt(event.getExpiresAt());
			
			// Store the DTO in Redis
			redisTemplate.opsForValue().set(jobKey, dto);
			
			// Add job reference to the queue
			redisTemplate.opsForList().rightPush(QUEUE_KEY, jobKey);
			
			Long queueSize = redisTemplate.opsForList().size(QUEUE_KEY);
			log.info("[RedisExportQueueService] ✓ Job {} added to queue. Queue size: {}", 
				event.getJobId(), queueSize);
		} catch (Exception e) {
			log.error("[RedisExportQueueService] ✗ Failed to add job {} to queue", event.getJobId(), e);
			throw new ExcelExportException("Failed to add job to Redis queue", e);
		}
	}

	@Override
	public ExportRequestedEvent<?, ?> poll(long timeout, TimeUnit unit) throws InterruptedException {
		try {
			// Convert timeout to seconds for Redis BLPOP
			long timeoutSeconds = unit.toSeconds(timeout);
			
			// Use leftPop with timeout (blocking operation)
			String jobKey = (String) redisTemplate.opsForList().leftPop(QUEUE_KEY, timeoutSeconds, TimeUnit.SECONDS);
			
			if (jobKey == null) {
				return null;
			}
			
			// Retrieve the DTO from Redis
			SerializableExportEvent dto = convertToDto(redisTemplate.opsForValue().get(jobKey));
			
			if (dto != null) {
				// Remove the job data from Redis after polling
				redisTemplate.delete(jobKey);
				
				// Retrieve the service and filter from in-memory cache
				CachedJobData cachedData = jobDataCache.remove(jobKey);
				
				if (cachedData == null) {
					log.error("[RedisExportQueueService] ✗ Cached data not found for job {}", dto.getJobId());
					throw new ExcelExportException("Cached job data not found for job: " + dto.getJobId());
				}
				
				// Reconstruct the full event with the service and filter
				ExportRequestedEvent<?, ?> event = reconstructEvent(dto, cachedData);
				
				Long remaining = redisTemplate.opsForList().size(QUEUE_KEY);
				log.info("[RedisExportQueueService] → Job {} removed from queue. Remaining: {}", 
					event.getJobId(), remaining);
				return event;
			}
			
			return null;
		} catch (Exception e) {
			log.error("[RedisExportQueueService] ✗ Error polling from queue", e);
			throw new InterruptedException("Error polling from Redis queue: " + e.getMessage());
		}
	}

	@Override
	public boolean removeFromQueue(String coId, String jobId) {
		try {
			String jobKey = getJobKey(coId, jobId);
			
			// Remove from the queue list
			Long removed = redisTemplate.opsForList().remove(QUEUE_KEY, 0, jobKey);
			
			// Delete the job data and cached data
			if (removed != null && removed > 0) {
				redisTemplate.delete(jobKey);
				jobDataCache.remove(jobKey);
				
				Long queueSize = redisTemplate.opsForList().size(QUEUE_KEY);
				log.info("[RedisExportQueueService] ✓ Job {} removed from queue. Queue size: {}", 
					jobId, queueSize);
				return true;
			} else {
				log.warn("[RedisExportQueueService] ✗ Job {} not found in queue", jobId);
				return false;
			}
		} catch (Exception e) {
			log.error("[RedisExportQueueService] ✗ Error removing job {} from queue", jobId, e);
			return false;
		}
	}

	@Override
	public int getQueueSize() {
		try {
			Long size = redisTemplate.opsForList().size(QUEUE_KEY);
			return size != null ? size.intValue() : 0;
		} catch (Exception e) {
			log.error("[RedisExportQueueService] ✗ Error getting queue size", e);
			return 0;
		}
	}

	@Override
	public boolean isInQueue(String coId, String jobId) {
		try {
			String jobKey = getJobKey(coId, jobId);
			
			// Check if the job key exists in the queue
			Long size = redisTemplate.opsForList().size(QUEUE_KEY);
			if (size == null || size == 0) {
				return false;
			}
			
			// Get all items in the queue and check for existence
			var queueItems = redisTemplate.opsForList().range(QUEUE_KEY, 0, -1);
			return queueItems != null && queueItems.contains(jobKey);
		} catch (Exception e) {
			log.error("[RedisExportQueueService] ✗ Error checking if job {} is in queue", jobId, e);
			return false;
		}
	}
	
	private String getJobKey(String coId, String jobId) {
		return JOB_KEY_PREFIX + coId + ":" + jobId;
	}
	
	@SuppressWarnings("unchecked")
	private <T, F> ExportRequestedEvent<T, F> reconstructEvent(
			SerializableExportEvent dto, 
			CachedJobData cachedData) {
		return new ExportRequestedEvent<>(
			dto.getCoId(),
			dto.getJobId(),
			(F) cachedData.filter,
			dto.getFileNm(),
			dto.getRqstUsrId(),
			dto.getExpiresAt(),
			(IExcelExportService<T, F>) cachedData.service
		);
	}
	
	private SerializableExportEvent convertToDto(Object rawDto) {
		if (rawDto instanceof SerializableExportEvent) {
			return (SerializableExportEvent) rawDto;
		}
		
		// If it's a LinkedHashMap or other type, use ObjectMapper to convert
		try {
			return objectMapper.convertValue(rawDto, SerializableExportEvent.class);
		} catch (Exception e) {
			log.error("[RedisExportQueueService] ✗ Failed to convert DTO", e);
			throw new ExcelExportException("Failed to deserialize export event from Redis", e);
		}
	}
	
	// Inner class to hold cached service and filter data
	private static class CachedJobData {
		final IExcelExportService<?, ?> service;
		final Object filter;
		
		CachedJobData(IExcelExportService<?, ?> service, Object filter) {
			this.service = service;
			this.filter = filter;
		}
	}
}
