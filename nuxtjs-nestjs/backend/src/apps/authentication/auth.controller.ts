import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { User } from '@infra/database/entities/administration';
import { AuthService } from './services/auth.service';
import { CurrentUser, Public } from './decorators';
import { LoginRequestDto, LoginResponseDto, RefreshTokenRequestDto, RefreshTokenResponseDto } from './dto';
import { LocalAuthGuard } from './guards';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() req: LoginRequestDto): Promise<LoginResponseDto> {
    return this.authService.login(req);
  }

  
  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  refreshToken(
    @Body() dto: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    return this.authService.refreshTokens(dto.refreshToken);
  }


  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @CurrentUser() user: User,
  ): Promise<{ success: boolean }> {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await this.authService.logout(token, user.usrId);
    }
    return { success: true };
  }


  @Get('me')
  me(@CurrentUser() user: User) {
    const { usrPwd: _, ...safeUser } = user;
    return safeUser;
  }
}
