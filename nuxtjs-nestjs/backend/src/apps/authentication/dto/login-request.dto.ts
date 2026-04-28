import { IsString, Matches, MaxLength } from 'class-validator';

export class LoginRequestDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: 'tenantId must be alphanumeric with _ or -' })
  tenantId: string;
}
