import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenRequestDto {
  @IsString()
  refreshToken!: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  accessExpireIn!: number;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  refreshExpireIn!: number;
}
