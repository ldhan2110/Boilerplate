import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContext } from '../request-context';
import { TenantDataSourceManager } from '../datasource/tenant-datasource-manager';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(private readonly manager: TenantDataSourceManager) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const tenantId: string | undefined = request.user?.tenantId;
    const userId: string | undefined = request.user?.usrId;

    if (!tenantId) {
      return next.handle();
    }

    await this.manager.getDataSource(tenantId);

    return RequestContext.run({ tenantId, userId }, () => next.handle());
  }
}
