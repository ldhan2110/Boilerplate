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

    await this.manager.getDataSource(tenantId);

    return new Observable((subscriber) => {
      TenantContext.run(tenantId, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
