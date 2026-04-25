import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { AuthCacheService } from './services/auth-cache.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { UsersModule } from '@module/administration/users/users.module';
import { RedisService } from '@infra/redis';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({}),
    ConfigModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    {
      provide: AuthCacheService,
      useFactory: (config: ConfigService, jwtService: JwtService) => {
        const enabled = config.get<string>('REDIS_ENABLED', 'false') === 'true';
        if (!enabled) return null;
        const redisService = new RedisService();
        return new AuthCacheService(redisService, jwtService, config);
      },
      inject: [ConfigService, JwtService],
    },
  ],
  controllers: [AuthController],
})
export class AuthModule {}
