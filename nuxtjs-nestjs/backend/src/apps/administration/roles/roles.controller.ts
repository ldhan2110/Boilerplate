import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SuccessDto } from '@infra/common/dto';
import { RoleDto, RoleListDto, SearchRoleDto } from './dto';
import { RolesService } from './roles.service';

@Controller('/adm/role')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // POST /api/adm/role/getRoleList
  @Post('getRoleList')
  @HttpCode(HttpStatus.OK)
  getRoleList(@Body() dto: SearchRoleDto): Promise<RoleListDto> {
    return this.rolesService.getRoleList(dto);
  }

  // POST /api/adm/role/getRole
  @Post('getRole')
  @HttpCode(HttpStatus.OK)
  getRole(@Body() dto: SearchRoleDto): Promise<RoleDto> {
    return this.rolesService.getRole(dto);
  }

  // POST /api/adm/role/insertRole
  @Post('insertRole')
  @HttpCode(HttpStatus.OK)
  insertRole(@Body() dto: RoleDto): Promise<SuccessDto> {
    return this.rolesService.insertRole(dto);
  }

  // POST /api/adm/role/updateRole
  @Post('updateRole')
  @HttpCode(HttpStatus.OK)
  updateRole(@Body() dto: RoleDto): Promise<SuccessDto> {
    return this.rolesService.updateRole(dto);
  }

  // POST /api/adm/role/deleteRoles
  @Post('deleteRoles')
  @HttpCode(HttpStatus.OK)
  deleteRoles(@Body() list: RoleDto[]): Promise<SuccessDto> {
    return this.rolesService.deleteRoles(list);
  }
}
