import { IsNumber, IsString } from 'class-validator';

export class RefreshTokenRequestDto {
  @IsString()
  refreshToken!: string;
}

export class RefreshTokenResponseDto {
  @IsString()
  accessToken!: string;

  @IsNumber()
  accessExpireIn!: number;

  @IsString()
  refreshToken!: string;

  @IsNumber()
  refreshExpireIn!: number;
}
