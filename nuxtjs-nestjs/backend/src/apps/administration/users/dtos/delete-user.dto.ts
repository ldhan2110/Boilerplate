import { IsArray, IsString } from 'class-validator';
import { BaseDto } from '@infra/common/dto';

export class DeleteUserDto extends BaseDto {
  @IsArray()
  @IsString({ each: true })
  usrIds: string[];
}
