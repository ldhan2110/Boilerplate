import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from '@infra/config';
import { LoggerModule } from '@infra/logger';
import { DatabaseModule } from '@infra/database';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggerModule,
    DatabaseModule,
  ],
  exports: [ConfigModule, LoggerModule, DatabaseModule],
})
export class InfraModule {}
