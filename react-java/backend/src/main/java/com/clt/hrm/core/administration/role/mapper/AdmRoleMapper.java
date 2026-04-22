package com.clt.hrm.core.administration.role.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.clt.hrm.core.administration.role.dtos.RoleAuthDto;
import com.clt.hrm.core.administration.role.dtos.RoleDto;
import com.clt.hrm.core.administration.role.dtos.SearchRoleDto;

@Mapper
public interface AdmRoleMapper {
	List<RoleDto> searchRoleList(SearchRoleDto request);
	int countRoleList(SearchRoleDto request);
	RoleDto selectRoleInfo(SearchRoleDto request);
	List<RoleAuthDto> searchRoleAuth(SearchRoleDto request);
	void deleteAllRoleAuth(RoleDto request);
	void insertRole(RoleDto request);
	void insertRoleAuth(RoleAuthDto auth);
	void updateRole(RoleDto request);
	void mergeRoleAuth(RoleAuthDto roleAuth);
	void deleteRoleAuth(RoleAuthDto roleAuth);
}
