import { IsOptional, IsString } from 'class-validator';
import { SearchBaseDto } from '@infra/common/dto/search-base.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SearchUserDto extends SearchBaseDto {
  @IsOptional()
  @IsString()
  usrId?: string;

  @IsOptional()
  @IsString()
  usrNm?: string;
}
