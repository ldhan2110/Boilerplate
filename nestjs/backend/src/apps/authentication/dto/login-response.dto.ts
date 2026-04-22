export class LoginResponseDto {
  accessToken!: string;
  accessExpireIn!: number;
  refreshToken!: string;
  refreshExpireIn!: number;
}
