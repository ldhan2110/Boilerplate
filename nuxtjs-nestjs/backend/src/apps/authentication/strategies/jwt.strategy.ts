import { Injectable, Optional } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { UsersService } from '@module/administration/users/services/users.service';
import { AuthCacheService } from '@module/authentication/services/auth-cache.service';
import { TenantDataSourceManager } from '@infra/tenant/datasource/tenant-datasource-manager';
import { RequestContext } from '@infra/tenant/request-context';

export interface JwtPayload {
  sub: string;
  username: string;
  tenantId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
    private readonly tenantManager: TenantDataSourceManager,
    @Optional() private readonly authCacheService?: AuthCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    // Check if token is blacklisted
    if (this.authCacheService) {
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      if (token && await this.authCacheService.isTokenBlacklisted(token)) {
        throw new BizException('AUT000005', 'ERROR', 'Token is blacklisted. Please login again.');
      }
    }

    // Pre-warm tenant DataSource and run user lookup within tenant context
    await this.tenantManager.getDataSource(payload.tenantId);
    const user = await RequestContext.run({ tenantId: payload.tenantId }, () =>
      this.usersService.findByUsrId(payload.sub),
    );
    if (!user || !user.useFlg) {
      throw new BizException('AUT000004', 'ERROR', 'Unauthorized');
    }
    return { ...user, tenantId: payload.tenantId };
  }
}
