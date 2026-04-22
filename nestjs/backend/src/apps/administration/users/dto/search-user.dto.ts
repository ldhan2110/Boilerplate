import { IsOptional, IsString } from 'class-validator';
import { SearchBaseDto } from '@infra/common/dtos/search-base.dto';

export class SearchUserDto extends SearchBaseDto {
  @IsOptional()
  @IsString()
  usrId?: string;

  @IsOptional()
  @IsString()
  usrNm?: string;
}
