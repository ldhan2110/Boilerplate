import { IsNumber, IsString } from "class-validator";

export class LoginResponseDto {
  @IsString()
  accessToken!: string;

  @IsNumber()
  accessExpireIn!: number;

  @IsString()
  refreshToken!: string;

  @IsNumber()
  refreshExpireIn!: number;
}
