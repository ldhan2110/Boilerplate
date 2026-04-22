package com.clt.hrm.core.common.code.service;

import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.clt.hrm.core.common.code.dtos.SubCodeDto;
import com.clt.hrm.core.common.code.interfaces.IComCodeCacheService;
import com.clt.hrm.infra.configs.redis.service.RedisService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@ConditionalOnProperty(name = "redis.enabled", havingValue = "true", matchIfMissing = false)
public class ComCodeCacheService implements IComCodeCacheService {

	private static final String CACHE_PREFIX = "com::code::";

	@Autowired
	private RedisService redisService;
	
	@Autowired
	private ObjectMapper objectMapper;

	@Value("${com.code.cache.ttl:3600}")
	private long cacheTtl;

	/**
	 * Build cache key for sub codes
	 */
	private String buildCacheKey(String coId, String mstCd) {
		return coId + "::" + CACHE_PREFIX + mstCd;
	}

	/**
	 * Get sub codes from cache
	 */
	public List<SubCodeDto> getSubCodesFromCache(String coId, String mstCd) {
		try {
			String cacheKey = buildCacheKey(coId, mstCd);
			Object cached = redisService.get(cacheKey);
			
			if (cached == null) {
				return null;
			}
			
			// Handle List conversion
			if (cached instanceof List) {
				return objectMapper.convertValue(cached, new TypeReference<List<SubCodeDto>>() {});
			}
			
			return null;
		} catch (Exception e) {
			log.error("[ComCodeCacheService][getSubCodesFromCache] Error getting sub codes from cache: coId={}, mstCd={}", coId, mstCd, e);
			return null;
		}
	}

	/**
	 * Cache sub codes
	 */
	public void cacheSubCodes(String coId, String mstCd, List<SubCodeDto> subCodes) {
		try {
			String cacheKey = buildCacheKey(coId, mstCd);
			redisService.set(cacheKey, subCodes, cacheTtl, TimeUnit.SECONDS);
			log.debug("[ComCodeCacheService][CACHE INFO] Cached sub codes for coId='{}', mstCd='{}' with TTL: {} seconds", coId, mstCd, cacheTtl);
		} catch (Exception e) {
			log.error("[ComCodeCacheService][cacheSubCodes] Error caching sub codes: coId={}, mstCd={}", coId, mstCd, e);
		}
	}

	/**
	 * Cache sub codes with custom TTL
	 */
	public void cacheSubCodes(String coId, String mstCd, List<SubCodeDto> subCodes, long ttl, TimeUnit timeUnit) {
		try {
			String cacheKey = buildCacheKey(coId, mstCd);
			redisService.set(cacheKey, subCodes, ttl, timeUnit);
			log.debug("[ComCodeCacheService][CACHE INFO] Cached sub codes for coId='{}', mstCd='{}' with custom TTL: {}{}", coId, mstCd, ttl, timeUnit);
		} catch (Exception e) {
			log.error("[ComCodeCacheService][cacheSubCodes] Error caching sub codes: coId={}, mstCd={}", coId, mstCd, e);
		}
	}

	/**
	 * Invalidate sub code cache for a specific master code
	 */
	public void invalidateSubCodeCacheByMaster(String coId, String mstCd) {
		try {
			String cacheKey = buildCacheKey(coId, mstCd);
			redisService.delete(cacheKey);
			log.info("[ComCodeCacheService][CACHE INVALIDATED] Sub code cache cleared for coId='{}', mstCd='{}'", coId, mstCd);
		} catch (Exception e) {
			log.error("[ComCodeCacheService][invalidateSubCodeCacheByMaster] Error invalidating sub code cache: coId={}, mstCd={}", coId, mstCd, e);
		}
	}

	/**
	 * Invalidate all sub code caches for a company (use with caution)
	 */
	public void invalidateAllSubCodeCaches(String coId) {
		try {
			String pattern = coId + "::" + CACHE_PREFIX + "*";
			Set<String> keys = redisService.keys(pattern);
			if (keys != null && !keys.isEmpty()) {
				redisService.delete(keys);
				log.info("[ComCodeCacheService][CACHE INVALIDATED] Cleared {} sub code caches for coId='{}'", keys.size(), coId);
			}
		} catch (Exception e) {
			log.error("[ComCodeCacheService][invalidateAllSubCodeCaches] Error invalidating all sub code caches: coId={}", coId, e);
		}
	}
}

