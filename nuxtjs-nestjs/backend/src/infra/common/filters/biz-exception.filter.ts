import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import { BizException } from '@infra/common/exceptions';
import { ErrorDto } from '../dto';
import { AppLogger } from '@infra/logger';

@Injectable()
@Catch()
export class BizExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, body } = this.resolve(exception);
    response.status(status).json(body);
  }

  private resolve(exception: unknown): {
    status: number;
    body: ErrorDto;
  } {
    // 1. BizException — first-class business error
    if (exception instanceof BizException) {
      const logMethod =
        exception.errorType === 'WARN' ? 'warn' : 'error';
      this.logger[logMethod](
        `[${exception.errorCode}] ${exception.errorMessage ?? ''}`,
        BizExceptionFilter.name,
      );
      return {
        status:
          exception.errorType === 'WARN'
            ? HttpStatus.BAD_REQUEST
            : HttpStatus.INTERNAL_SERVER_ERROR,
        body: new ErrorDto({
          errorCode: exception.errorCode,
          errorType: exception.errorType,
          errorMessage: exception.errorMessage ?? '',
        }),
      };
    }

    // 2. NestJS HttpException (validation pipe errors, guards, etc.)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === 'string' ? res : (res as any).message;
      const errorMessage = Array.isArray(message)
        ? message.join('; ')
        : (message ?? '');

      const logMethod = status >= 500 ? 'error' : 'warn';
      this.logger[logMethod](
        `[HTTP${String(status).padStart(3, '0')}] ${errorMessage}`,
        BizExceptionFilter.name,
      );
      return {
        status,
        body: new ErrorDto({
          errorCode: `HTTP${String(status).padStart(3, '0')}`,
          errorType: 'ERROR',
          errorMessage,
        }),
      };
    }

    // 3. Unknown error
    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
      BizExceptionFilter.name,
    );
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: new ErrorDto({
        errorCode: 'SYS000001',
        errorType: 'ERROR',
        errorMessage: 'Internal server error',
      }),
    };
  }
}
