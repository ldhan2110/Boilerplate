import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      lazyConnect: true,
    });

    this.client.connect().catch((err) => {
      this.logger.error('Failed to connect to Redis', err);
    });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  // ==================== Key Operations ====================

  async hasKey(key: string): Promise<boolean> {
    return (await this.client.exists(key)) === 1;
  }

  async delete(key: string | string[]): Promise<number> {
    if (Array.isArray(key)) {
      if (key.length === 0) return 0;
      return this.client.del(...key);
    }
    return this.client.del(key);
  }

  async expire(key: string, ttlMs: number): Promise<boolean> {
    return (await this.client.pexpire(key, ttlMs)) === 1;
  }

  // ==================== String Operations ====================

  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlMs && ttlMs > 0) {
      await this.client.set(key, serialized, 'PX', ttlMs);
    } else {
      await this.client.set(key, serialized);
    }
  }

  async get<T = string>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (value === null) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  // ==================== Set Operations ====================

  async setAdd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async setMembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async setIsMember(key: string, member: string): Promise<boolean> {
    return (await this.client.sismember(key, member)) === 1;
  }

  // ==================== Pattern Operations ====================

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }
}
