package com.clt.hrm.core.administration.role.interfaces;

import com.clt.hrm.core.administration.role.dtos.RoleDto;
import com.clt.hrm.core.administration.role.dtos.RoleListDto;
import com.clt.hrm.core.administration.role.dtos.SearchRoleDto;

public interface IAdmRoleService {
	RoleListDto getRoleList(SearchRoleDto request);
	RoleDto getRole(SearchRoleDto request);
	void insertRole(RoleDto request);
	void updateRole(RoleDto request);
}
