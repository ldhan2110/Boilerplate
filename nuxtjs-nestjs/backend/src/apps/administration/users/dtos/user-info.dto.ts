import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { BaseDto } from '@infra/common/dto';

export class UserInfoDto extends BaseDto {
  @IsOptional()
  @IsString()
  usrId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  usrNm?: string;

  @IsOptional()
  @IsString()
  usrPwd?: string;

  @IsOptional()
  @IsEmail()
  usrEml?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  usrPhn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  usrAddr?: string;

  @IsOptional()
  @IsString()
  usrDesc?: string;

  @IsOptional()
  @IsString()
  usrFileId?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  roleNm?: string;

  @IsOptional()
  @IsString()
  langVal?: string;

  @IsOptional()
  @IsString()
  sysModVal?: string;

  @IsOptional()
  @IsString()
  dtFmtVal?: string;

  @IsOptional()
  @IsString()
  sysColrVal?: string;
}
