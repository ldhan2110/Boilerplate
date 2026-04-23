import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { SuccessDto } from '@infra/common/dto/success.dto';
import {
  ChangeUserInfoDto,
  SearchUserDto,
  UserInfoDto,
  UserInfoListDto,
} from './dto';
import { UsersService } from './users.service';

@Controller('api/adm/user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // POST /api/adm/user/getListUserInfo
  @Post('getListUserInfo')
  @HttpCode(HttpStatus.OK)
  getListUserInfo(@Body() dto: SearchUserDto): Promise<UserInfoListDto> {
    return this.usersService.getListUserInfo(dto);
  }

  // POST /api/adm/user/getUserInfo
  @Post('getUserInfo')
  @HttpCode(HttpStatus.OK)
  getUserInfo(@Body() dto: SearchUserDto): Promise<UserInfoDto | null> {
    return this.usersService.getUserInfo(dto);
  }

  // POST /api/adm/user/createUser
  @Post('createUser')
  @HttpCode(HttpStatus.OK)
  createUser(@Body() dto: UserInfoDto): Promise<SuccessDto> {
    return this.usersService.createUser(dto);
  }

  // POST /api/adm/user/updateUser
  @Post('updateUser')
  @HttpCode(HttpStatus.OK)
  updateUser(@Body() dto: UserInfoDto): Promise<SuccessDto> {
    return this.usersService.updateUser(dto);
  }

  // POST /api/adm/user/changeUserInfo
  @Post('changeUserInfo')
  @HttpCode(HttpStatus.OK)
  changeUserInfo(@Body() dto: ChangeUserInfoDto): Promise<SuccessDto> {
    return this.usersService.changeUserInfo(dto);
  }

  // POST /api/adm/user/resetUserPassword
  @Post('resetUserPassword')
  @HttpCode(HttpStatus.OK)
  resetUserPassword(@Body() users: UserInfoDto[]): Promise<SuccessDto> {
    return this.usersService.resetUserPassword(users);
  }

  // POST /api/adm/user/saveUserSetting
  @Post('saveUserSetting')
  @HttpCode(HttpStatus.OK)
  saveUserSetting(@Body() dto: UserInfoDto): Promise<SuccessDto> {
    return this.usersService.saveUserSetting(dto);
  }
}
