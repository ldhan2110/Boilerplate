package com.clt.hrm.core.administration.role.service;

import com.clt.hrm.core.administration.role.interfaces.IAdmRoleService;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clt.hrm.core.administration.role.dtos.RoleAuthDto;
import com.clt.hrm.core.administration.role.dtos.RoleDto;
import com.clt.hrm.core.administration.role.dtos.RoleListDto;
import com.clt.hrm.core.administration.role.dtos.SearchRoleDto;
import com.clt.hrm.core.administration.role.mapper.AdmRoleMapper;
import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.utils.CommonFunction;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AdmRoleService implements IAdmRoleService {
	@Autowired
	AdmRoleMapper roleMapper;

	public RoleListDto getRoleList(SearchRoleDto request) {
		RoleListDto result = new RoleListDto();
		result.setRoleList(roleMapper.searchRoleList(request));
		result.setTotal(roleMapper.countRoleList(request));
		return result;
	}

	public RoleDto getRole(SearchRoleDto request) {
		RoleDto role = roleMapper.selectRoleInfo(request);
		if (role != null) {
			role.setRoleAuthList(roleMapper.searchRoleAuth(request));
		};
		return role;
	}

	@Transactional(rollbackFor = Exception.class)
	public void insertRole(RoleDto request) {
		final String usrId = CommonFunction.getUserId();

		// Check exist Role Code
		SearchRoleDto cond = new SearchRoleDto();
		cond.setCoId(request.getCoId());
		cond.setRoleCd(request.getRoleCd());
		RoleDto existRole = roleMapper.selectRoleInfo(cond);
		if (existRole != null) {
			throw new BizException("ADM000010", null, "Role already exists.", HttpStatus.BAD_REQUEST);
		}

		// Insert Role
		try {
			// Insert ADM_ROLE
			request.setCreUsrId(usrId);
			request.setUpdUsrId(usrId);
			roleMapper.insertRole(request);

			// Insert ADM_ROLE_AUTH
			List<RoleAuthDto> roleAuthList = request.getRoleAuthList();  
	        for (RoleAuthDto roleAuth : roleAuthList) {
	        	roleAuth.setRoleId(request.getRoleId());
	        	roleMapper.insertRoleAuth(roleAuth);
	        }
		} catch (Exception e) {
			log.error("[AdmRoleService][insertRole] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void updateRole(RoleDto request) {
		final String usrId = CommonFunction.getUserId();
		
		try {
			// Update ADM_ROLE
			request.setCreUsrId(usrId);
			request.setUpdUsrId(usrId);
			roleMapper.updateRole(request);

			// Remove and re-insert ADM_ROLE_AUTH
			List<RoleAuthDto> roleAuthList = request.getRoleAuthList();
			
			roleMapper.deleteAllRoleAuth(request);
			
	        for (RoleAuthDto roleAuth : roleAuthList) {
	        	roleAuth.setRoleId(request.getRoleId());
	        	roleAuth.setCreUsrId(usrId);
	        	roleAuth.setUpdUsrId(usrId);
	        	roleMapper.mergeRoleAuth(roleAuth);
	        }
		} catch (Exception e) {
			log.error("[AdmRoleService][updateRole] Error: {}", e.getMessage(), e);
			throw e;
		}
		
	}
}
