import { Global, Module } from '@nestjs/common';
import { TenantModule } from '@infra/tenant';
import { QueryFactoryModule } from './query-factory';

@Global()
@Module({
  imports: [
    TenantModule,
    QueryFactoryModule,
  ],
  exports: [TenantModule, QueryFactoryModule],
})
export class DatabaseModule {}
