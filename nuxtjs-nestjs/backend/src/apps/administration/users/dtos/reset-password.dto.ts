import { IsOptional, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsOptional()
  @IsString()
  usrId?: string;

  @IsOptional()
  @IsString()
  oldPassword?: string;

  @IsOptional()
  @IsString()
  newPassword?: string;

  @IsOptional()
  @IsString()
  confirmNewPassword?: string;
}
