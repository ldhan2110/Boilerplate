import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { validate } from '@infra/config/env.validation';
import { LoggerModule, LoggerInterceptor } from '@infra/logger';
import { DatabaseModule } from '@infra/database/database.module';
import { AuthModule } from '@module/authentication/auth.module';
import { JwtAuthGuard } from '@module/authentication/guards/jwt-auth.guard';
import { AdministrationModule } from '@module/administration/administration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    LoggerModule,
    DatabaseModule,
    AuthModule,
    AdministrationModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    // Apply JwtAuthGuard globally; use @Public() to opt-out on specific routes
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
