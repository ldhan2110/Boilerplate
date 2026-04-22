package com.clt.hrm.infra.configs.redis.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@ConditionalOnProperty(name = "redis.enabled", havingValue = "true", matchIfMissing = false)
public class RedisService {
	@Autowired
	private RedisTemplate<String, Object> redisTemplate;
	private final ObjectMapper objectMapper = new ObjectMapper();

	// ==================== Key Operations ====================
	/**
	 * Check if key exists
	 */
	public Boolean hasKey(String key) {
		return redisTemplate.hasKey(key);
	}

	/**
	 * Delete single key
	 */
	public Boolean delete(String key) {
		return redisTemplate.delete(key);
	}

	/**
	 * Delete multiple keys
	 */
	public Long delete(Collection<String> keys) {
		return redisTemplate.delete(keys);
	}

	/**
	 * Set key expiration time
	 */
	public Boolean expire(String key, long timeout, TimeUnit unit) {
		return redisTemplate.expire(key, timeout, unit);
	}

	/**
	 * Get key expiration time in seconds
	 */
	public Long getExpire(String key) {
		return redisTemplate.getExpire(key, TimeUnit.SECONDS);
	}

	// ==================== String Operations ====================

	/**
	 * Set string value
	 */
	public void set(String key, Object value) {
		redisTemplate.opsForValue().set(key, value);
	}

	/**
	 * Set string value with expiration
	 */
	public void set(String key, Object value, long timeout, TimeUnit unit) {
		redisTemplate.opsForValue().set(key, value, timeout, unit);
	}

	/**
	 * Get string value
	 */
	public Object get(String key) {
		return redisTemplate.opsForValue().get(key);
	}

	/**
	 * Get string value and cast to specific type
	 */
	@SuppressWarnings("unchecked")
	public <T> T get(String key, Class<T> clazz) {
		Object value = redisTemplate.opsForValue().get(key);
		if (value == null) {
			return null;
		}

		if (clazz.isInstance(value)) {
			return (T) value;
		}

		// Try to convert using ObjectMapper for complex objects
		return objectMapper.convertValue(value, clazz);
	}

	/**
	 * Increment numeric value
	 */
	public Long increment(String key) {
		return redisTemplate.opsForValue().increment(key);
	}

	/**
	 * Increment by delta
	 */
	public Long increment(String key, long delta) {
		return redisTemplate.opsForValue().increment(key, delta);
	}

	/**
	 * Decrement numeric value
	 */
	public Long decrement(String key) {
		return redisTemplate.opsForValue().decrement(key);
	}

	/**
	 * Decrement by delta
	 */
	public Long decrement(String key, long delta) {
		return redisTemplate.opsForValue().decrement(key, delta);
	}

	// ==================== List Operations ====================

	/**
	 * Get list size
	 */
	public Long listSize(String key) {
		return redisTemplate.opsForList().size(key);
	}

	/**
	 * Get list range
	 */
	public List<Object> listRange(String key, long start, long end) {
		return redisTemplate.opsForList().range(key, start, end);
	}

	/**
	 * Push value to list (right)
	 */
	public Long listRightPush(String key, Object value) {
		return redisTemplate.opsForList().rightPush(key, value);
	}

	/**
	 * Push multiple values to list (right)
	 */
	public Long listRightPushAll(String key, Object... values) {
		return redisTemplate.opsForList().rightPushAll(key, values);
	}

	/**
	 * Push value to list (left)
	 */
	public Long listLeftPush(String key, Object value) {
		return redisTemplate.opsForList().leftPush(key, value);
	}

	/**
	 * Pop value from list (right)
	 */
	public Object listRightPop(String key) {
		return redisTemplate.opsForList().rightPop(key);
	}

	/**
	 * Pop value from list (left)
	 */
	public Object listLeftPop(String key) {
		return redisTemplate.opsForList().leftPop(key);
	}

	// ==================== Set Operations ====================

	/**
	 * Add members to set
	 */
	public Long setAdd(String key, Object... values) {
		return redisTemplate.opsForSet().add(key, values);
	}

	/**
	 * Get all set members
	 */
	public Set<Object> setMembers(String key) {
		return redisTemplate.opsForSet().members(key);
	}

	/**
	 * Check if member exists in set
	 */
	public Boolean setIsMember(String key, Object value) {
		return redisTemplate.opsForSet().isMember(key, value);
	}

	/**
	 * Get set size
	 */
	public Long setSize(String key) {
		return redisTemplate.opsForSet().size(key);
	}

	/**
	 * Remove members from set
	 */
	public Long setRemove(String key, Object... values) {
		return redisTemplate.opsForSet().remove(key, values);
	}

	// ==================== Hash Operations ====================

	/**
	 * Put single entry in hash
	 */
	public void hashPut(String key, String hashKey, Object value) {
		redisTemplate.opsForHash().put(key, hashKey, value);
	}

	/**
	 * Put all entries in hash
	 */
	public void hashPutAll(String key, Map<String, Object> map) {
		redisTemplate.opsForHash().putAll(key, map);
	}

	/**
	 * Get single hash entry
	 */
	public Object hashGet(String key, String hashKey) {
		return redisTemplate.opsForHash().get(key, hashKey);
	}

	/**
	 * Get all hash entries
	 */
	public Map<Object, Object> hashGetAll(String key) {
		return redisTemplate.opsForHash().entries(key);
	}

	/**
	 * Delete hash entries
	 */
	public Long hashDelete(String key, Object... hashKeys) {
		return redisTemplate.opsForHash().delete(key, hashKeys);
	}

	/**
	 * Check if hash key exists
	 */
	public Boolean hashHasKey(String key, String hashKey) {
		return redisTemplate.opsForHash().hasKey(key, hashKey);
	}

	/**
	 * Get all hash keys
	 */
	public Set<Object> hashKeys(String key) {
		return redisTemplate.opsForHash().keys(key);
	}

	/**
	 * Get hash size
	 */
	public Long hashSize(String key) {
		return redisTemplate.opsForHash().size(key);
	}

	// ==================== Pattern Operations ====================

	/**
	 * Get all keys matching pattern
	 */
	public Set<String> keys(String pattern) {
		return redisTemplate.keys(pattern);
	}
}
