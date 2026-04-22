package com.clt.hrm.infra.configs.redis.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.time.Duration;

@Configuration
@ConditionalOnProperty(name = "redis.enabled", havingValue = "true", matchIfMissing = false)
@EnableCaching
public class RedisConfig {

	// Read property from application.properties / application.yml
	@Value("${spring.data.redis.host}")
	private String redisHost;

	@Value("${spring.data.redis.port}")
	private int redisPort;

	@Value("${spring.data.redis.password}")
	private String redisPassword;

	// 1. Declare standalone config (host, port, password)
	@Bean
	RedisStandaloneConfiguration redisStandaloneConfiguration() {
		RedisStandaloneConfiguration cfg = new RedisStandaloneConfiguration(redisHost, redisPort);
		if (redisPassword != null && !redisPassword.isBlank()) {
			cfg.setPassword(redisPassword);
		}
		return cfg;
	}

	// 2. Factory creates connect Lettuce
	@Bean
	RedisConnectionFactory redisConnectionFactory(RedisStandaloneConfiguration cfg) {
		return new LettuceConnectionFactory(cfg);
	}

	// 3. Template to interact key/value
	@Bean
	RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
		RedisTemplate<String, Object> template = new RedisTemplate<>();
	    template.setConnectionFactory(factory);

	    // 1️⃣ Create ObjectMapper with JavaTimeModule
	    ObjectMapper mapper = new ObjectMapper();
	    mapper.registerModule(new JavaTimeModule());
	    mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

	    // 2️⃣ Pass it to GenericJackson2JsonRedisSerializer
	    GenericJackson2JsonRedisSerializer serializer = new GenericJackson2JsonRedisSerializer(mapper);

	    // 3️⃣ Configure template serializers
	    template.setKeySerializer(new StringRedisSerializer());
	    template.setValueSerializer(serializer);
	    template.setHashKeySerializer(new StringRedisSerializer());
	    template.setHashValueSerializer(serializer);

	    template.afterPropertiesSet();
	    return template;
	}

	// 4. CacheManager for @Cacheable, @CacheEvict…
	// TTL config default 10 min, key use String, value JSON
	@Bean
	CacheManager cacheManager(RedisConnectionFactory factory) {
		RedisCacheConfiguration cacheConfig = RedisCacheConfiguration.defaultCacheConfig()
				.entryTtl(Duration.ofMinutes(10))
				.serializeKeysWith(
						RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
				.serializeValuesWith(RedisSerializationContext.SerializationPair
						.fromSerializer(new GenericJackson2JsonRedisSerializer()));

		return RedisCacheManager.builder(factory).cacheDefaults(cacheConfig).transactionAware().build();
	}
}
