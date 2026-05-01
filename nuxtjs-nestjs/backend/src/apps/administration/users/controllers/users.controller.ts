import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { SuccessDto } from '@infra/common/dto';
import {
  ChangeUserInfoDto,
  SearchUserDto,
  UserInfoDto,
  UserInfoListDto,
} from '../dtos';
import { UsersService } from '../services/users.service';

@Controller('/adm/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('getListUserInfo')
  @HttpCode(HttpStatus.OK)
  getListUserInfo(@Body() dto: SearchUserDto): Promise<UserInfoListDto> {
    return this.usersService.getListUserInfo(dto);
  }

  @Post('getUserInfo')
  @HttpCode(HttpStatus.OK)
  getUserInfo(@Body() dto: SearchUserDto): Promise<UserInfoDto | null> {
    return this.usersService.getUserInfo(dto);
  }

  @Post('saveUsers')
  @HttpCode(HttpStatus.OK)
  saveUsers(@Body() list: UserInfoDto[]): Promise<SuccessDto> {
    return this.usersService.saveUsers(list);
  }

  @Post('changeUserInfo')
  @HttpCode(HttpStatus.OK)
  changeUserInfo(@Body() dto: ChangeUserInfoDto): Promise<SuccessDto> {
    return this.usersService.changeUserInfo(dto);
  }


  @Post('resetUserPassword')
  @HttpCode(HttpStatus.OK)
  resetUserPassword(@Body() users: UserInfoDto[]): Promise<SuccessDto> {
    return this.usersService.resetUserPassword(users);
  }
}
