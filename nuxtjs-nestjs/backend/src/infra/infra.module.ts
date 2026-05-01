import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from '@infra/config';
import { LoggerModule } from '@infra/logger';
import { DatabaseModule } from '@infra/database';
import { FileModule } from '@infra/file';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggerModule,
    DatabaseModule,
    FileModule,
  ],
  exports: [ConfigModule, LoggerModule, DatabaseModule, FileModule],
})
export class InfraModule {}
