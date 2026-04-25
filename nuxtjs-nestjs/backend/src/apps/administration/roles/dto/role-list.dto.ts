import { ApiProperty } from '@nestjs/swagger';
import { RoleDto } from './role.dto';

export class RoleListDto {
  @ApiProperty({ type: [RoleDto] })
  roleList: RoleDto[];

  @ApiProperty()
  total: number;
}
