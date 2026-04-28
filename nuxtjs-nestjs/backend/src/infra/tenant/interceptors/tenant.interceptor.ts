import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from '../tenant-context';
import { TenantDataSourceManager } from '../datasource/tenant-datasource-manager';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private readonly manager: TenantDataSourceManager) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId: string | undefined = request.user?.tenantId;

    if (!tenantId) {
      return next.handle();
    }

    // Pre-warm DataSource in cache (async)
    await this.manager.getDataSource(tenantId);

    // Wrap entire handler + downstream pipeline in tenant context
    return TenantContext.run(tenantId, () => next.handle());
  }
}
