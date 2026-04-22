package com.clt.hrm.core.authentication.interfaces;

import com.clt.hrm.core.authentication.entities.UserInfo;

import java.util.concurrent.TimeUnit;

public interface IAuthCacheService {
	UserInfo getUserFromCache(String username);
	void cacheUser(String username, UserInfo userInfo);
	void cacheUser(String username, UserInfo userInfo, long ttl, TimeUnit timeUnit);
	void invalidateUserCache(String username);
	void invalidateAllUserCaches();
	void refreshUserCache(String username, UserInfo userInfo);
	void registerUserToken(String username, String token);
	boolean isTokenBlacklisted(String token);
	void logout(String token, String username);
	void logoutAllDevices(String username);
}
