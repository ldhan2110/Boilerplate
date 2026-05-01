import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContext } from '../tenant-context';
import { TenantDataSourceManager } from '../datasource/tenant-datasource-manager';
import { UserContext } from '@infra/user-context';

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

    if (!tenantId && !userId) {
      return next.handle();
    }

    let handler = () => next.handle();

    if (userId) {
      const inner = handler;
      handler = () => UserContext.run(userId, inner);
    }

    if (tenantId) {
      await this.manager.getDataSource(tenantId);
      const inner = handler;
      handler = () => TenantContext.run(tenantId, inner);
    }

    return handler();
  }
}
