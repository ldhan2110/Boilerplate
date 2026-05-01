import { ApiProperty } from '@nestjs/swagger';
import { UserInfoDto } from './user-info.dto';

export class UserInfoListDto {
  @ApiProperty({ type: [UserInfoDto] })
  userInfo: UserInfoDto[];

  @ApiProperty()
  total: number;
}
