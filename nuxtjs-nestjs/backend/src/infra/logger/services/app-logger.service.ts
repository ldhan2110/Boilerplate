import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
  constructor(private readonly winston: winston.Logger) {}

  log(message: any, context?: string): void {
    this.winston.info(message, { context });
  }

  error(message: any, trace?: string, context?: string): void {
    const msg = trace ? `${message}\n  ${trace}` : message;
    this.winston.error(msg, { context });
  }

  warn(message: any, context?: string): void {
    this.winston.warn(message, { context });
  }

  debug(message: any, context?: string): void {
    this.winston.debug(message, { context });
  }

  verbose(message: any, context?: string): void {
    this.winston.verbose(message, { context });
  }
}
