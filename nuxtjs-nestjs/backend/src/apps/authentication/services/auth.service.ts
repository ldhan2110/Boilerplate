import { Injectable, Optional } from '@nestjs/common';
import { BizException } from '@infra/common/exceptions';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@infra/database/entities/administration';
import { UsersService } from '@module/administration/users/users.service';
import { JwtPayload } from '../strategies/jwt.strategy';
import { LoginRequestDto, LoginResponseDto, RefreshTokenResponseDto, UpdatePreferencesDto } from '../dto';
import { AuthCacheService } from './auth-cache.service';
import { TenantDataSourceManager } from '@infra/tenant/datasource/tenant-datasource-manager';
import { TenantContext } from '@infra/tenant/tenant-context';
import { SuccessDto } from '@infra/common/dto';
import { QueryFactory } from '@infra/database/query-factory';

@Injectable()
export class AuthService {
  private readonly accessExpireMs: number;
  private readonly refreshExpireMs: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly tenantManager: TenantDataSourceManager,
    private readonly qf: QueryFactory,
    @Optional() private readonly authCacheService?: AuthCacheService,
  ) {
    this.accessExpireMs = config.getOrThrow<number>('JWT_ACCESS_EXPIRE_MS');
    this.refreshExpireMs = config.getOrThrow<number>('JWT_REFRESH_EXPIRE_MS');
  }

  // Called by LocalStrategy to validate credentials
  // The login form sends `username` field which maps to usrId internally
  async validateUser(usrId: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByUsrId(usrId);
    if (!user || !user.useFlg) return null;

    const isMatch = await bcrypt.compare(password, user.usrPwd);
    return isMatch ? user : null;
  }

  async login(req: LoginRequestDto): Promise<LoginResponseDto> {
    const tenantId = req.tenantId;

    // Pre-warm tenant DataSource and run user lookup within tenant context
    // so QueryFactory routes to the correct tenant database
    await this.tenantManager.getDataSource(tenantId);
    const user = await TenantContext.run(tenantId, () =>
      this.validateUser(req.username, req.password),
    );
    if (!user) {
      throw new BizException('AUT000001', 'ERROR', 'Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user, tenantId);
    const refreshToken = this.generateRefreshToken(user, tenantId);

    // Register token in Redis cache if available
    if (this.authCacheService) {
      await this.authCacheService.registerUserToken(req.username, accessToken);
    }

    return {
      accessToken,
      accessExpireIn: this.accessExpireMs,
      refreshToken,
      refreshExpireIn: this.refreshExpireMs,
    };
  }

  async logout(token: string, username: string): Promise<void> {
    if (this.authCacheService) {
      await this.authCacheService.logout(token, username);
    }
  }

  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponseDto> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new BizException('AUT000001', 'ERROR', 'Refresh token expired or invalid');
    }

    await this.tenantManager.getDataSource(payload.tenantId);
    const user = await TenantContext.run(payload.tenantId, () =>
      this.usersService.findById(payload.sub),
    );
    if (!user || !user.useFlg) {
      throw new BizException('AUT000002', 'ERROR', 'User not found or inactive');
    }

    return {
      accessToken: this.generateAccessToken(user, payload.tenantId),
      accessExpireIn: this.accessExpireMs,
      refreshToken: this.generateRefreshToken(user, payload.tenantId),
      refreshExpireIn: this.refreshExpireMs,
    };
  }

  private generateAccessToken(user: User, tenantId: string): string {
    const payload: JwtPayload = { sub: user.usrId, username: user.usrId, tenantId };
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: Math.floor(this.accessExpireMs / 1000),
    });
  }

  private generateRefreshToken(user: User, tenantId: string): string {
    const payload: JwtPayload = { sub: user.usrId, username: user.usrId, tenantId };
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: Math.floor(this.refreshExpireMs / 1000),
    });
  }

  async updatePreferences(usrId: string, dto: UpdatePreferencesDto): Promise<SuccessDto> {
    const updates: Partial<User> = {};
    if (dto.langVal !== undefined) updates.langVal = dto.langVal;
    if (dto.sysModVal !== undefined) updates.sysModVal = dto.sysModVal;
    if (dto.dtFmtVal !== undefined) updates.dtFmtVal = dto.dtFmtVal;
    if (dto.sysColrVal !== undefined) updates.sysColrVal = dto.sysColrVal;

    await this.qf.transaction(async (tx) => {
      await tx.update(User).where({ usrId }).set(updates).execute();
    });

    return SuccessDto.of(true, 1);
  }
}
