import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@infra/redis';

const USER_CACHE_PREFIX = 'auth:user:';
const USER_TOKEN_CACHE_PREFIX = 'auth:user:tokens:';
const BLACKLIST_CACHE_PREFIX = 'auth:blacklist:';

@Injectable()
export class AuthCacheService {
  private readonly logger = new Logger(AuthCacheService.name);
  private readonly cacheTtlMs: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {
    this.cacheTtlMs = this.config.get<number>('JWT_CACHE_TTL_MS', 3600000);
  }

  // ==================== User Cache Operations ====================

  async getUserFromCache<T = Record<string, unknown>>(username: string): Promise<T | null> {
    try {
      const cacheKey = USER_CACHE_PREFIX + username;
      return await this.redisService.get<T>(cacheKey);
    } catch (e) {
      this.logger.error(`Error getting user from cache: ${username}`, e);
      return null;
    }
  }

  async cacheUser(username: string, userInfo: Record<string, unknown>, ttlMs?: number): Promise<void> {
    try {
      const cacheKey = USER_CACHE_PREFIX + username;
      const ttl = ttlMs ?? this.cacheTtlMs;
      await this.redisService.set(cacheKey, userInfo, ttl);
      this.logger.log(`Cached user '${username}' with TTL: ${ttl}ms`);
    } catch (e) {
      this.logger.error(`Error caching user: ${username}`, e);
    }
  }

  async invalidateUserCache(username: string): Promise<void> {
    try {
      const cacheKey = USER_CACHE_PREFIX + username;
      await this.redisService.delete(cacheKey);
      this.logger.log(`User '${username}' cache has been cleared`);
    } catch (e) {
      this.logger.error(`Error invalidating user cache: ${username}`, e);
    }
  }

  // ==================== Token Registration ====================

  async registerUserToken(username: string, token: string): Promise<void> {
    try {
      const userTokensKey = USER_TOKEN_CACHE_PREFIX + username;
      await this.redisService.setAdd(userTokensKey, token);

      const decoded = this.jwtService.decode(token) as { exp?: number };
      if (decoded?.exp) {
        const ttlMs = decoded.exp * 1000 - Date.now();
        if (ttlMs > 0) {
          await this.redisService.expire(userTokensKey, ttlMs);
        }
      }

      this.logger.debug(`Registered token for user: ${username}`);
    } catch (e) {
      this.logger.error(`Error registering user token: ${username}`, e);
    }
  }

  // ==================== Blacklist Operations ====================

  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenHash = this.hashToken(token);
      const blacklistKey = BLACKLIST_CACHE_PREFIX + tokenHash;
      return await this.redisService.hasKey(blacklistKey);
    } catch (e) {
      this.logger.error('Error checking if token is blacklisted', e);
      return false;
    }
  }

  async logout(token: string, username: string): Promise<void> {
    try {
      const decoded = this.jwtService.decode(token) as { exp?: number };
      const expirationMs = decoded?.exp ? decoded.exp * 1000 : 0;

      await this.blacklistToken(token, expirationMs);
      await this.invalidateUserCache(username);

      this.logger.log(`User logged out successfully: ${username}`);
    } catch (e) {
      this.logger.error(`Error during logout for user: ${username}`, e);
      throw e;
    }
  }

  async logoutAllDevices(username: string): Promise<void> {
    try {
      const userTokensKey = USER_TOKEN_CACHE_PREFIX + username;
      const tokens = await this.redisService.setMembers(userTokensKey);

      if (tokens && tokens.length > 0) {
        for (const token of tokens) {
          const decoded = this.jwtService.decode(token) as { exp?: number };
          const expirationMs = decoded?.exp ? decoded.exp * 1000 : 0;
          await this.blacklistToken(token, expirationMs);
        }
        await this.redisService.delete(userTokensKey);
      }

      await this.invalidateUserCache(username);
      this.logger.log(`User logged out from all devices: ${username}`);
    } catch (e) {
      this.logger.error(`Error during logout all devices for user: ${username}`, e);
      throw e;
    }
  }

  private async blacklistToken(token: string, expirationMs: number): Promise<void> {
    const tokenHash = this.hashToken(token);
    const blacklistKey = BLACKLIST_CACHE_PREFIX + tokenHash;
    const ttlMs = expirationMs - Date.now();

    if (ttlMs > 0) {
      await this.redisService.set(blacklistKey, 'blacklisted', ttlMs);
      this.logger.log(`Token blacklisted with TTL: ${ttlMs}ms`);
    } else {
      this.logger.warn('Token already expired, no need to blacklist');
    }
  }

  private hashToken(token: string): string {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = ((hash << 5) - hash + char) | 0;
    }
    return String(hash);
  }
}
