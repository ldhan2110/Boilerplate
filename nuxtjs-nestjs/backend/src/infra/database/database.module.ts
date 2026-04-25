import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueryFactoryModule } from './query-factory';
import { PostgresConfigModule } from './configs';
import { ALL_ENTITIES } from './query-factory/entity-registry';

@Global()
@Module({
  imports: [
    PostgresConfigModule,
    QueryFactoryModule,
    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  exports: [QueryFactoryModule, TypeOrmModule],
})
export class DatabaseModule {}
