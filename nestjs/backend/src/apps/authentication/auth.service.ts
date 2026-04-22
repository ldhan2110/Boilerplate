import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '@infra/database/entities/administration';
import { UsersService } from '@module/administration/users/users.service';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly accessExpireMs: number;
  private readonly refreshExpireMs: number;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
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

  // Mirrors Java: authenticate()
  async login(user: User): Promise<LoginResponseDto> {
    return {
      accessToken: this.generateAccessToken(user),
      accessExpireIn: this.accessExpireMs,
      refreshToken: this.generateRefreshToken(user),
      refreshExpireIn: this.refreshExpireMs,
    };
  }

  // Mirrors Java: generateAccessToken() — rotates both tokens
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponseDto> {
    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new ForbiddenException('Refresh token expired or invalid');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.useFlg) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      accessToken: this.generateAccessToken(user),
      accessExpireIn: this.accessExpireMs,
      refreshToken: this.generateRefreshToken(user),
      refreshExpireIn: this.refreshExpireMs,
    };
  }

  private generateAccessToken(user: User): string {
    const payload: JwtPayload = { sub: user.usrId, username: user.usrId };
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: Math.floor(this.accessExpireMs / 1000),
    });
  }

  private generateRefreshToken(user: User): string {
    const payload: JwtPayload = { sub: user.usrId, username: user.usrId };
    return this.jwtService.sign(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: Math.floor(this.refreshExpireMs / 1000),
    });
  }
}
