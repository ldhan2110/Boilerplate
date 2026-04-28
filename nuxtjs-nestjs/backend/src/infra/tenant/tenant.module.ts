import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { MetadataDatabaseModule } from './metadata/metadata-database.module';
import { TenantMetadataService } from './metadata/tenant-metadata.service';
import { TenantDataSourceProperties } from './datasource/tenant-datasource.properties';
import { TenantDataSourceManager } from './datasource/tenant-datasource-manager';
import { createRoutingDataSource } from './datasource/tenant-routing-datasource';
import { TenantInterceptor } from './interceptors/tenant.interceptor';

@Global()
@Module({
  imports: [MetadataDatabaseModule],
  providers: [
    TenantDataSourceProperties,
    TenantMetadataService,
    TenantDataSourceManager,
    {
      provide: DataSource,
      useFactory: (
        manager: TenantDataSourceManager,
        metadataDs: DataSource,
      ) => createRoutingDataSource(manager, metadataDs),
      inject: [TenantDataSourceManager, getDataSourceToken('metadata')],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
  ],
  exports: [DataSource, TenantDataSourceManager, TenantMetadataService],
})
export class TenantModule {}
