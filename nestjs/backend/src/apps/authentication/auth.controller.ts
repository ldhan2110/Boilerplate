import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User } from '@infra/database/entities/administration';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenRequestDto, RefreshTokenResponseDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/login
  // Mirrors Java: POST /api/adm/auth/login
  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@CurrentUser() user: User): Promise<LoginResponseDto> {
    return this.authService.login(user);
  }

  // POST /api/auth/refresh-token
  // Mirrors Java: POST /api/adm/auth/refresh-token — rotates both tokens
  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  refreshToken(
    @Body() dto: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  // POST /api/auth/logout
  // Mirrors Java: POST /api/adm/auth/logout
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(): { success: boolean } {
    // Token invalidation via Redis/blacklist can be added here later
    return { success: true };
  }

  // GET /api/auth/me
  // Mirrors Java: GET /api/adm/auth/getUserRole — returns current user info
  @Get('me')
  me(@CurrentUser() user: User) {
    const { usrPwd: _, ...safeUser } = user;
    return safeUser;
  }
}
