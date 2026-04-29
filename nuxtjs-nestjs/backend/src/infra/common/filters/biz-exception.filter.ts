import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { BizException } from '@infra/common/exceptions';
import { ErrorDto } from '../dto';

@Catch()
export class BizExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BizExceptionFilter.name);

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
      exception instanceof Error ? exception.stack : exception,
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
