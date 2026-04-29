import { Global, Module } from '@nestjs/common';
import * as winston from 'winston';
import { LoggerProperties } from './logger.properties';
import { AppLogger } from './app-logger.service';
import { TypeOrmLogger } from './typeorm-logger';
import { createWinstonLogger } from './winston.factory';

export const WINSTON_LOGGER = Symbol('WINSTON_LOGGER');

@Global()
@Module({
  providers: [
    LoggerProperties,
    {
      provide: WINSTON_LOGGER,
      useFactory: (props: LoggerProperties) => createWinstonLogger(props),
      inject: [LoggerProperties],
    },
    {
      provide: AppLogger,
      useFactory: (winstonLogger: winston.Logger) => new AppLogger(winstonLogger),
      inject: [WINSTON_LOGGER],
    },
    {
      provide: TypeOrmLogger,
      useFactory: (winstonLogger: winston.Logger, props: LoggerProperties) =>
        new TypeOrmLogger(winstonLogger, props),
      inject: [WINSTON_LOGGER, LoggerProperties],
    },
  ],
  exports: [AppLogger, TypeOrmLogger, WINSTON_LOGGER],
})
export class LoggerModule {}
