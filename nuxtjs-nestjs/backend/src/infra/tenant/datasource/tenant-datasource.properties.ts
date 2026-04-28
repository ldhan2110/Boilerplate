import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantDataSourceProperties {
  readonly poolMin: number;
  readonly poolMax: number;
  readonly poolIdleMs: number;
  readonly evictionMs: number;
  readonly connectTimeoutMs: number;

  constructor(config: ConfigService) {
    this.poolMin = config.get<number>('TENANT_POOL_MIN', 5);
    this.poolMax = config.get<number>('TENANT_POOL_MAX', 20);
    this.poolIdleMs = config.get<number>('TENANT_POOL_IDLE_MS', 600_000);
    this.evictionMs = config.get<number>('TENANT_POOL_EVICTION_MS', 3_600_000);
    this.connectTimeoutMs = config.get<number>('TENANT_POOL_CONNECT_TIMEOUT', 30_000);
  }
}
