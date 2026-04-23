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
import { CurrentUser, Public } from './decorators';
import { LoginRequestDto, LoginResponseDto, RefreshTokenRequestDto, RefreshTokenResponseDto } from './dto';
import { LocalAuthGuard } from './guards';

@Controller('api/auth')
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
  logout(): { success: boolean } {
    // Token invalidation via Redis/blacklist can be added here later
    return { success: true };
  }


  @Get('me')
  me(@CurrentUser() user: User) {
    const { usrPwd: _, ...safeUser } = user;
    return safeUser;
  }
}
