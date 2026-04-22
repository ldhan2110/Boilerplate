import { IsOptional, IsString } from 'class-validator';
import { UserInfoDto } from './user-info.dto';

export class ChangeUserInfoDto extends UserInfoDto {
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
