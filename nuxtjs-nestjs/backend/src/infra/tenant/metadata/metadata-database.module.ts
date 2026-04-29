import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QueryFactory } from '@infra/database/query-factory/query-factory.service';
import { TypeOrmLogger } from '@infra/logger';
import { METADATA_QUERY_FACTORY } from './metadata-query-factory';
import { TenantMaster } from './entities/tenant-master.entity';
import { TenantDbConfig } from './entities/tenant-db-config.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: 'metadata',
      inject: [ConfigService, TypeOrmLogger],
      useFactory: (config: ConfigService, typeOrmLogger: TypeOrmLogger) => ({
        type: 'postgres' as const,
        host: config.get<string>('METADATA_DB_HOST'),
        port: config.get<number>('METADATA_DB_PORT'),
        username: config.get<string>('METADATA_DB_USERNAME'),
        password: config.get<string>('METADATA_DB_PASSWORD'),
        database: config.get<string>('METADATA_DB_NAME'),
        entities: [TenantMaster, TenantDbConfig],
        synchronize: false,
        logging: true,
        maxQueryExecutionTime: 1000,
        logger: typeOrmLogger,
      }),
    }),
    TypeOrmModule.forFeature([TenantMaster, TenantDbConfig], 'metadata'),
  ],
  providers: [
    {
      provide: METADATA_QUERY_FACTORY,
      useFactory: (ds: DataSource) => new QueryFactory(ds),
      inject: [getDataSourceToken('metadata')],
    },
  ],
  exports: [METADATA_QUERY_FACTORY, TypeOrmModule],
})
export class MetadataDatabaseModule {}
