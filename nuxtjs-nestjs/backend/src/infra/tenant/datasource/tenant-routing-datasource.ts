import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantContext } from '../tenant-context';
import { TenantDataSourceManager } from './tenant-datasource-manager';

const logger = new Logger('TenantRoutingDataSource');

export function createRoutingDataSource(
  manager: TenantDataSourceManager,
  fallbackDs: DataSource,
): DataSource {
  return new Proxy(fallbackDs, {
    get(target, prop, receiver) {
      const tenantId = TenantContext.getTenantId();
      if (tenantId) {
        const tenantDs = manager.getDataSourceSync(tenantId);
        if (tenantDs) {
          return Reflect.get(tenantDs, prop, receiver);
        }
        logger.warn(
          `Tenant '${tenantId}' DataSource not in cache — falling back to default. ` +
          `This indicates TenantInterceptor did not run.`,
        );
      }
      return Reflect.get(target, prop, receiver);
    },
  });
}
