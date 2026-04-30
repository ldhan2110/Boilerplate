import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from '@module/authentication/auth.module';
import { JwtAuthGuard } from '@module/authentication/guards/jwt-auth.guard';
import { AdministrationModule } from '@module/administration/administration.module';
import { InfraModule } from '@infra/infra.module';
import { LoggerInterceptor } from '@infra/logger';

@Module({
  imports: [
    InfraModule,
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
