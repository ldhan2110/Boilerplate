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
import { RequestContextInterceptor } from './interceptors/request-context.interceptor';
import { ENTITY_GLOB } from '@infra/database/query-factory/entity-registry';
import { TypeOrmLogger } from '@infra/logger';

@Global()
@Module({
  imports: [
    MetadataDatabaseModule,
    // Default application DB — used as fallback for non-tenant-scoped operations
    // (bootstrap, health checks, public endpoints without tenant context)
    TypeOrmModule.forRootAsync({
      name: 'default-app',
      inject: [ConfigService, TypeOrmLogger],
      useFactory: (config: ConfigService, typeOrmLogger: TypeOrmLogger) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: ENTITY_GLOB,
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: true,
        maxQueryExecutionTime: 1000,
        logger: typeOrmLogger,
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
      useClass: RequestContextInterceptor,
    },
  ],
  exports: [DataSource, TenantDataSourceManager, TenantMetadataService],
})
export class TenantModule {}
