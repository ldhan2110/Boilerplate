import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class BaseDto {
  @IsOptional()
  @IsString()
  coId?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;

  @IsOptional()
  @IsString()
  createdAt?: Date;

  @IsOptional()
  @IsString()
  updatedAt?: Date;

  @IsOptional()
  @IsString()
  useFlg?: string;

  @IsOptional()
  @IsString()
  procFlag?: string;
}
