import { Global, Module } from '@nestjs/common';
import { QueryFactory } from './query-factory.service';

/**
 * QueryFactoryModule registers QueryFactory as a global provider.
 *
 * Because it is decorated with @Global(), any module that imports the root
 * AppModule (which imports QueryFactoryModule) can inject QueryFactory without
 * declaring a local import.
 */
@Global()
@Module({
  providers: [QueryFactory],
  exports: [QueryFactory],
})
export class QueryFactoryModule {}
