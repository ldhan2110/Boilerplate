package com.clt.hrm.core.authentication.service;

import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.core.authentication.interfaces.IAuthCacheService;
import com.clt.hrm.infra.configs.redis.service.RedisService;
import com.clt.hrm.infra.configs.security.utils.JwtUtils;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@ConditionalOnProperty(name = "redis.enabled", havingValue = "true", matchIfMissing = false)
public class AuthCacheService implements IAuthCacheService {

	private static final String USER_CACHE_PREFIX = "auth:user:";
	private static final String USER_TOKEN_CACHE_PREFIX = "auth:user:tokens:";
	private static final String BLACKLIST_CACHE_PREFIX =" auth:blacklist:";

	@Autowired
	private RedisService redisService;
	
	@Autowired
    private JwtUtils jwtUtils;

	@Value("${jwt.cache.ttl:3600}")
	private long cacheTtl;

	/**
	 * Get user from cache
	 */
	public UserInfo getUserFromCache(String username) {
		try {
			String cacheKey = USER_CACHE_PREFIX + username;
			UserInfo user = redisService.get(cacheKey, UserInfo.class);
			return user;
		} catch (Exception e) {
			log.error("[AuthCacheService][getUserFromCache] Error getting user from cache: {}", username, e);
			return null;
		}
	}

	/**
	 * Cache user details
	 */
	public void cacheUser(String username, UserInfo userInfo) {
		try {
			String cacheKey = USER_CACHE_PREFIX + username;
			redisService.set(cacheKey, userInfo, cacheTtl, TimeUnit.SECONDS);
			log.info("[AuthCacheService][CACHE INFO] Cached user '{}' with TTL: {} seconds", username, cacheTtl);
		} catch (Exception e) {
			log.error("[AuthCacheService][cacheUser] Error caching user: {}", username, e);
		}
	}

	/**
	 * Cache user with custom TTL
	 */
	public void cacheUser(String username, UserInfo userInfo, long ttl, TimeUnit timeUnit) {
		try {
			String cacheKey = USER_CACHE_PREFIX + username;
			redisService.set(cacheKey, userInfo, ttl, timeUnit);
			log.info("[AuthCacheService][CACHE INFO] Cached user: {} with custom TTL: {}{}", username, ttl, timeUnit);
		} catch (Exception e) {
			log.error("[AuthCacheService][cacheUser] Error caching user: {}", username, e);
		}
	}

	/**
	 * Invalidate user cache Call this when user details are updated (password
	 * change, role change, etc.)
	 */
	public void invalidateUserCache(String username) {
		try {
			String cacheKey = USER_CACHE_PREFIX + username;
			redisService.delete(cacheKey);
			log.info("[AuthCacheService][CACHE INVALIDATED] User '{}' cache has been cleared", username);
		} catch (Exception e) {
			log.error("[AuthCacheService][invalidateUserCache] Error invalidating user cache: {}", username, e);
		}
	}

	/**
	 * Invalidate all user caches (use with caution)
	 */
	public void invalidateAllUserCaches() {
		try {
			var keys = redisService.keys(USER_CACHE_PREFIX + "*");
			if (keys != null && !keys.isEmpty()) {
				redisService.delete(keys);
				log.info("[AuthCacheService][CACHE INVALIDATED] Cleared {} user caches", keys.size());
			}
		} catch (Exception e) {
			log.error("[AuthCacheService][invalidateAllUserCaches] Error invalidating all user caches", e);
		}
	}

	/**
	 * Refresh user cache Gets user from DB and updates cache
	 */
	public void refreshUserCache(String username, UserInfo userInfo) {
		invalidateUserCache(username);
		cacheUser(username, userInfo);
		log.info("[CACHE REFRESHED] User '{}' cache has been refreshed", username);
	}
	
	
	 /**
     * Store user token mapping (call this during login)
     * This allows logout from all devices
     */
    public void registerUserToken(String username, String token) {
        try {
            String userTokensKey = USER_TOKEN_CACHE_PREFIX + username;
            redisService.setAdd(userTokensKey, token);
            
            // Set expiration for the tokens set (same as JWT expiration)
            long expirationTime = jwtUtils.extractExpiration(token).getTime();
            long ttl = expirationTime - System.currentTimeMillis();
            
            if (ttl > 0) {
                redisService.expire(userTokensKey, ttl, TimeUnit.MILLISECONDS);
            }
            
            log.debug("[AuthCacheService]: Registered token for user: {}", username);
        } catch (Exception e) {
            log.error("[AuthCacheService][registerUserToken] Error registering user token: {}", username, e);
        }
    }
	
	// ==================== Blacklist Operations ====================
	/**
     * Check if a token is blacklisted
     */
    public boolean isTokenBlacklisted(String token) {
        try {
            String tokenHash = String.valueOf(token.hashCode());
            String blacklistKey = BLACKLIST_CACHE_PREFIX + tokenHash;
            return Boolean.TRUE.equals(redisService.hasKey(blacklistKey));
        } catch (Exception e) {
            log.error("[AuthCacheService][isTokenBlacklisted] Error checking if token is blacklisted", e);
            return false;
        }
    }
    
    /**
     * Logout user by blacklisting their token
     */
    public void logout(String token, String username) {
        try {
            // Get token expiration time
            long expirationTime = jwtUtils.extractExpiration(token).getTime();
            
            // Blacklist the token
            blacklistToken(token, expirationTime);
            
            // Optionally, you can also invalidate the user cache
            // This forces re-fetching from DB on next login
            this.invalidateUserCache(username);
            
            log.info("[AuthCacheService]: User logged out successfully: {}", username);
        } catch (Exception e) {
            log.error("Error during logout for user: {}", username, e);
            throw new RuntimeException("Logout failed", e);
        }
    }
    
    private void blacklistToken(String token, long expirationTime) {
        try {
            String tokenHash = String.valueOf(token.hashCode());
            String blacklistKey = BLACKLIST_CACHE_PREFIX + tokenHash;
            
            // Calculate TTL - token should be blacklisted until it expires
            long ttl = expirationTime - System.currentTimeMillis();
        
            if (ttl > 0) {
                redisService.set(blacklistKey, "blacklisted", ttl, TimeUnit.MILLISECONDS);
                log.info("[AuthCacheService]: Token blacklisted with TTL: {}ms", ttl);
            } else {
                log.warn("[AuthCacheService]: Token already expired, no need to blacklist");
            }
        } catch (Exception e) {
            log.error("[AuthCacheService][blacklistToken] Error blacklisting token", e);
            throw new RuntimeException("[AuthCacheService][blacklistToken] Failed to blacklist token", e);
        }
    }
    
    /**
     * Logout user from all devices by invalidating all their tokens
     * This requires storing user->token mapping during login
     */
    public void logoutAllDevices(String username) {
        try {
            // Blacklist all tokens for this user
            String userTokensKey = USER_TOKEN_CACHE_PREFIX + username;
            var tokens = redisService.setMembers(userTokensKey);
            
            if (tokens != null && !tokens.isEmpty()) {
                for (Object token : tokens) {
                    String tokenStr = token.toString();
                    long expirationTime = jwtUtils.extractExpiration(tokenStr).getTime();
                    blacklistToken(tokenStr, expirationTime);
                }
                
                // Clear the user's token set
                redisService.delete(userTokensKey);
            }
            
            // Invalidate user cache
            this.invalidateUserCache(username);
            
            log.info("[AuthCacheService]: User logged out from all devices: {}", username);
        } catch (Exception e) {
            log.error("[AuthCacheService][logoutAllDevices] Error during logout all devices for user: {}", username, e);
            throw new RuntimeException("[AuthCacheService][logoutAllDevices] Logout all devices failed", e);
        }
    }
}
