package com.clt.hrm.infra.tracking.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.concurrent.TimeUnit;

/**
 * Async Redis write service for tracking module usage, active user presence, and DAU data.
 *
 * All methods are dispatched to the trackingExecutor thread pool (@Async).
 * This ensures zero latency is added to HRM-X API responses.
 *
 * Redis key schema:
 * - tracking:usage:{tenantId}:{date}:{MODULE}  — module request counter (incremented per call)
 * - tracking:user_seen:{tenantId}:{userId}     — presence key with 15-min TTL (user is "active")
 * - tracking:active_set:{tenantId}             — SET of active user IDs, 15-min rolling TTL
 * - tracking:dau:{tenantId}:{date}             — SET of daily unique user IDs, 48-hour TTL
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "tracking.enabled", havingValue = "true", matchIfMissing = false)
public class TrackingService {

	@Autowired
	private RedisTemplate<String, Object> redisTemplate;

	/**
	 * Records a single API call for the given tenant, user, and module.
	 * All Redis operations are performed asynchronously in the trackingExecutor pool.
	 *
	 * @param tenantId Tenant ID (coId)
	 * @param userId   Authenticated user ID
	 * @param module   Uppercase module code (e.g. "EMP", "ATT")
	 */
	@Async("trackingExecutor")
	public void recordAsync(String tenantId, String userId, String module) {
		try {
			String today = LocalDate.now().toString();

			// Module usage counter — increments atomically per tenant/date/module
			String moduleKey = "tracking:usage:" + tenantId + ":" + today + ":" + module;
			redisTemplate.opsForValue().increment(moduleKey);

			// Active user presence key (per D-01) — per-user key with 15-min TTL
			// A user is "active" if this key exists
			String userKey = "tracking:user_seen:" + tenantId + ":" + userId;
			redisTemplate.opsForValue().set(userKey, "1", 15, TimeUnit.MINUTES);

			// Active user SET for cardinality (per D-02)
			// SCARD tracking:active_set:{tenantId} gives the current active user count
			// Rolling 15-min TTL means the SET auto-expires when no users are active
			String activeSetKey = "tracking:active_set:" + tenantId;
			redisTemplate.opsForSet().add(activeSetKey, userId);
			redisTemplate.expire(activeSetKey, 15, TimeUnit.MINUTES);

			// DAU SET for daily unique users (per D-03)
			// SCARD tracking:dau:{tenantId}:{date} gives the daily unique user count
			// 48-hour TTL ensures availability through end-of-day plus one day buffer
			String dauKey = "tracking:dau:" + tenantId + ":" + today;
			redisTemplate.opsForSet().add(dauKey, userId);
			redisTemplate.expire(dauKey, 48, TimeUnit.HOURS);

		} catch (Exception e) {
			// Tracking is best-effort — log but never propagate
			log.warn("Tracking Redis write failed for tenant={} user={} module={}: {}",
					tenantId, userId, module, e.getMessage());
		}
	}
}
