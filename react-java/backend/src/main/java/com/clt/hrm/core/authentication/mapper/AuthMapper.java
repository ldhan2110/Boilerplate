package com.clt.hrm.core.authentication.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.clt.hrm.core.authentication.dtos.RoleAuthInfoDto;
import com.clt.hrm.core.authentication.dtos.RoleInfoDto;
import com.clt.hrm.core.authentication.entities.UserInfo;

@Mapper
public interface AuthMapper {
	UserInfo loadUserByUsername(String username);

	String isActiveCompany(String companyId);

	String isActiveUser(String username);

    RoleInfoDto getUserRole(@Param("coId") String coId, @Param("roleId") String roleId);

    List<RoleAuthInfoDto> getUserRoleAuth(@Param("coId") String coId, @Param("roleId") String roleId);
}
