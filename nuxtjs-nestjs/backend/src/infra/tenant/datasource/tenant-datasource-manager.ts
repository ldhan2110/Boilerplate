import {
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationShutdown,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantMetadataService } from '../metadata/tenant-metadata.service';
import { TenantDataSourceProperties } from './tenant-datasource.properties';
import { TenantDbConfig } from '../metadata/entities/tenant-db-config.entity';

interface CachedDataSource {
  dataSource: DataSource;
  lastAccess: number;
}

@Injectable()
export class TenantDataSourceManager implements OnApplicationShutdown {
  private readonly logger = new Logger(TenantDataSourceManager.name);
  private readonly cache = new Map<string, CachedDataSource>();
  private readonly pending = new Map<string, Promise<DataSource>>();
  private evictionTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly metadataService: TenantMetadataService,
    private readonly props: TenantDataSourceProperties,
  ) {
    this.evictionTimer = setInterval(() => this.evictIdle(), 60_000);
  }

  async getDataSource(tenantId: string): Promise<DataSource> {
    const cached = this.cache.get(tenantId);
    if (cached && cached.dataSource.isInitialized) {
      cached.lastAccess = Date.now();
      return cached.dataSource;
    }

    const inflight = this.pending.get(tenantId);
    if (inflight) return inflight;

    const promise = this.initDataSource(tenantId);
    this.pending.set(tenantId, promise);
    try {
      return await promise;
    } finally {
      this.pending.delete(tenantId);
    }
  }

  getDataSourceSync(tenantId: string): DataSource | null {
    const cached = this.cache.get(tenantId);
    if (cached && cached.dataSource.isInitialized) {
      cached.lastAccess = Date.now();
      return cached.dataSource;
    }
    return null;
  }

  private async initDataSource(tenantId: string): Promise<DataSource> {
    const config = await this.metadataService.getTenantDbConfig(tenantId);
    if (!config) {
      throw new NotFoundException(`Tenant '${tenantId}' not found or inactive`);
    }

    const ds = this.createDataSource(config);
    try {
      await ds.initialize();
    } catch (err) {
      throw new ServiceUnavailableException(
        `Failed to connect to tenant '${tenantId}' database: ${(err as Error).message}`,
      );
    }

    this.cache.set(tenantId, { dataSource: ds, lastAccess: Date.now() });
    this.logger.log(`Initialized DataSource for tenant '${tenantId}'`);
    return ds;
  }

  private createDataSource(config: TenantDbConfig): DataSource {
    return new DataSource({
      type: 'postgres',
      host: config.dbHost,
      port: config.dbPort,
      database: config.dbName,
      username: config.dbUsername,
      password: config.dbPassword,
      entities: [],
      synchronize: false,
      connectTimeoutMS: this.props.connectTimeoutMs,
      extra: {
        min: this.props.poolMin,
        max: this.props.poolMax,
        idleTimeoutMillis: this.props.poolIdleMs,
      },
    });
  }

  private evictIdle(): void {
    const now = Date.now();
    for (const [tenantId, entry] of this.cache) {
      if (now - entry.lastAccess > this.props.evictionMs) {
        this.logger.log(`Evicting idle DataSource for tenant '${tenantId}'`);
        entry.dataSource.destroy().catch((err) => {
          this.logger.warn(`Error destroying DataSource for tenant '${tenantId}': ${err.message}`);
        });
        this.cache.delete(tenantId);
      }
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
    }

    const destroyPromises: Promise<void>[] = [];
    for (const [tenantId, entry] of this.cache) {
      this.logger.log(`Shutting down DataSource for tenant '${tenantId}'`);
      destroyPromises.push(entry.dataSource.destroy());
    }
    await Promise.allSettled(destroyPromises);
    this.cache.clear();
  }
}
