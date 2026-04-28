import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { MetadataDatabaseModule } from './metadata/metadata-database.module';
import { TenantMetadataService } from './metadata/tenant-metadata.service';
import { TenantDataSourceProperties } from './datasource/tenant-datasource.properties';
import { TenantDataSourceManager } from './datasource/tenant-datasource-manager';
import { createRoutingDataSource } from './datasource/tenant-routing-datasource';
import { TenantInterceptor } from './interceptors/tenant.interceptor';
import { ALL_ENTITIES } from '@infra/database/query-factory/entity-registry';

@Global()
@Module({
  imports: [
    MetadataDatabaseModule,
    // Default application DB — used as fallback for non-tenant-scoped operations
    // (bootstrap, health checks, public endpoints without tenant context)
    TypeOrmModule.forRootAsync({
      name: 'default-app',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: ALL_ENTITIES,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: config.get<string>('DB_LOGGING') === 'true',
      }),
    }),
  ],
  providers: [
    TenantDataSourceProperties,
    TenantMetadataService,
    TenantDataSourceManager,
    {
      provide: DataSource,
      useFactory: (
        manager: TenantDataSourceManager,
        defaultDs: DataSource,
      ) => createRoutingDataSource(manager, defaultDs),
      inject: [TenantDataSourceManager, getDataSourceToken('default-app')],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  exports: [DataSource, TenantDataSourceManager, TenantMetadataService],
})
export class TenantModule {}
