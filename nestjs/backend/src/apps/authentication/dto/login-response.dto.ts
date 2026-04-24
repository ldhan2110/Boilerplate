import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  accessExpireIn!: number;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty()
  refreshExpireIn!: number;
}
