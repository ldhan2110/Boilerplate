package com.clt.hrm.core.administration.program.service;

import com.clt.hrm.core.administration.program.interfaces.IAdmProgramService;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.clt.hrm.core.administration.program.dtos.PermissionDto;
import com.clt.hrm.core.administration.program.dtos.ProgramDto;
import com.clt.hrm.core.administration.program.dtos.ProgramListDto;
import com.clt.hrm.core.administration.program.dtos.SearchProgramDto;
import com.clt.hrm.core.administration.program.mapper.AdmProgramMapper;
import com.clt.hrm.core.administration.role.dtos.RoleAuthDto;
import com.clt.hrm.core.administration.role.dtos.SearchRoleDto;
import com.clt.hrm.core.administration.role.mapper.AdmRoleMapper;
import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.utils.CommonFunction;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdmProgramService implements IAdmProgramService {
	private final AdmProgramMapper programMapper;

	private final AdmRoleMapper roleMapper;

	private final String VIEW_PERMISSION = "VIEW";
	private final String VIEW_PERMISSION_NAME = "View Page";
	private final String SUPERADMIN_ROLE = "SUPERADMIN";

	public ProgramListDto getProgramList(SearchProgramDto request) {
		ProgramListDto result = new ProgramListDto();
		result.setProgramList(programMapper.searchProgramTreeList(request));
		return result;
	}

	public ProgramDto getProgram(SearchProgramDto request) {
		return programMapper.selectProgram(request);
	}

	@Transactional(rollbackFor = Exception.class)
	public void insertProgram(ProgramDto request) {
		// Check if Exist Programs
		SearchProgramDto searchReq = new SearchProgramDto();
		searchReq.setCoId(request.getCoId());
		searchReq.setPgmCd(request.getPgmCd());
		ProgramDto existsProgram = programMapper.selectProgram(searchReq);
		if (existsProgram != null) {
			throw new BizException("ADM000006", null, "Program already exists.", HttpStatus.BAD_REQUEST);
		}

		// Check if Parent Program is Menu
		if ("UI".equals(request.getPgmTpCd())) {
			searchReq.setPgmCd(null);
			searchReq.setPgmId(request.getPrntPgmId());
			ProgramDto existsParentMenu = programMapper.selectProgram(searchReq);
			if (existsParentMenu == null) {
				throw new BizException("ADM000007", null, "Program does not exist.", HttpStatus.BAD_REQUEST);
			} else if (existsParentMenu != null && !"MENU".equals(existsParentMenu.getPgmTpCd())) {
				throw new BizException("ADM000008", null, "Parent Program must be a MENU", HttpStatus.BAD_REQUEST);
			}
		}

		try {
			final String usrId = CommonFunction.getUserId();
			request.setCreUsrId(usrId);
			request.setUpdUsrId(usrId);
			programMapper.insertProgram(request);

			// Auto Insert "VIEW" Permission
			PermissionDto perm = new PermissionDto();
			perm.setCoId(request.getCoId());
			perm.setPgmId(request.getPgmId());
			perm.setPermCd(VIEW_PERMISSION);
			perm.setPermNm(VIEW_PERMISSION_NAME);
			perm.setCreUsrId(usrId);
			perm.setUpdUsrId(usrId);
			programMapper.insertPermission(perm);

			// Auto Insert SUPERADMIN Role Auth if parent has it
			assignSuperAdminRoleInheritance(request.getCoId(), request.getPrntPgmId(), request.getPgmId(), perm.getPermId(), usrId);
		} catch (Exception e) {
			log.error("[AdmProgramService][insertProgram] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	@Transactional(rollbackFor = Exception.class)
	public void updateProgram(ProgramDto request) {
		// Check if Exist Programs
		SearchProgramDto searchReq = new SearchProgramDto();
		searchReq.setCoId(request.getCoId());
		searchReq.setPgmId(request.getPgmId());
		ProgramDto existsProgram = programMapper.selectProgram(searchReq);
		if (existsProgram == null) {
			throw new BizException("ADM000007", null, "Program does not exist.", HttpStatus.BAD_REQUEST);
		}

		// Check if Parent Program is Menu
		if ("UI".equals(request.getPgmTpCd())) {
			searchReq.setPgmCd(null);
			searchReq.setPgmId(request.getPrntPgmId());
			ProgramDto existsParentMenu = programMapper.selectProgram(searchReq);
			if (existsParentMenu == null) {
				throw new BizException("ADM000007", null, "Program does not exist.", HttpStatus.BAD_REQUEST);
			} else if (!"MENU".equals(existsParentMenu.getPgmTpCd())) {
				throw new BizException("ADM000008", null, "Parent Program must be a MENU", HttpStatus.BAD_REQUEST);
			}
		}

		try {
			final String usrId = CommonFunction.getUserId();
			request.setCreUsrId(usrId);
			request.setUpdUsrId(usrId);
			programMapper.updateProgram(request);
		} catch (Exception e) {
			log.error("[AdmProgramService][insertProgram] Error: {}", e.getMessage(), e);
			throw e;
		}

	}

	@Transactional(rollbackFor = Exception.class)
	public void deleteProgram(List<ProgramDto> request) {
		if (request == null || request.isEmpty()) {
			throw new BizException("COM000008", null, "Cannot Process Empty Array.", HttpStatus.BAD_REQUEST);
		}
		try {
			for (ProgramDto pgm : request) {
				SearchRoleDto cond = new SearchRoleDto();
				cond.setCoId(pgm.getCoId());
				cond.setPgmId(pgm.getPgmId());
				cond.setUseFlg("Y");
				List<RoleAuthDto> authList = roleMapper.searchRoleAuth(cond);
				if (!authList.isEmpty()) {
					throw new BizException("ADM000011", null,
							"One or more selected programs are referenced in role authorizations and cannot be deleted. Remove role associations and try again.",
							HttpStatus.BAD_REQUEST);
				}

				PermissionDto perm = new PermissionDto();
				perm.setCoId(pgm.getCoId());
				perm.setPgmId(pgm.getPgmId());
				programMapper.deletePermission(perm);
				programMapper.deleteProgram(pgm);
			}
		} catch (Exception e) {
			log.error("[AdmProgramService][deleteProgram] Error: {}", e.getMessage(), e);
			throw e;
		}

	}

	public List<PermissionDto> getPermissionByProgram(ProgramDto request) {
		return programMapper.getPermissionByProgram(request);
	}

	@Transactional(rollbackFor = Exception.class)
	public void savePermissionByProgram(List<PermissionDto> request) {
		if (request == null || request.isEmpty()) {
			throw new BizException("COM000008", null, "Cannot Process Empty Array.", HttpStatus.BAD_REQUEST);
		}

		try {
			RoleAuthDto roleAuth = new RoleAuthDto();
			final String usrId = CommonFunction.getUserId();
			List<PermissionDto> deletedPermList = request.stream()
					.filter(r -> "D".equals(r.getProcFlag()))
					.toList();
			for (PermissionDto perm : deletedPermList) {
				roleAuth.setCoId(perm.getCoId());
				roleAuth.setPermId(perm.getPermId());
				roleMapper.deleteRoleAuth(roleAuth);
				programMapper.deletePermission(perm);
			}

			List<PermissionDto> modifiedPermList = request.stream()
					.filter(r -> !"D".equals(r.getProcFlag()))
					.toList();
			for (PermissionDto perm : modifiedPermList) {
				perm.setCreUsrId(usrId);
				perm.setUpdUsrId(usrId);
				switch (perm.getProcFlag()) {
					case "I":
						programMapper.insertPermission(perm);
						
						// Auto Insert SUPERADMIN Role Auth if the program already has it
						assignSuperAdminRoleInheritance(perm.getCoId(), perm.getPgmId(), perm.getPgmId(), perm.getPermId(), usrId);
						break;
					case "U":
						programMapper.updatePermission(perm);
						break;
				}

			}
		} catch (Exception e) {
			log.error("[AdmProgramService][savePermissionByProgram] Error: {}", e.getMessage(), e);
			throw e;
		}
	}

	private void assignSuperAdminRoleInheritance(String coId, String sourcePgmId, String targetPgmId, String targetPermId, String usrId) {
		if (sourcePgmId == null || sourcePgmId.isEmpty()) return;

		SearchRoleDto roleCond = new SearchRoleDto();
		roleCond.setCoId(coId);
		roleCond.setPgmId(sourcePgmId);
		roleCond.setRoleCd(SUPERADMIN_ROLE);
		
		List<RoleAuthDto> superAdminAuths = roleMapper.searchRoleAuth(roleCond);
		
		if (superAdminAuths.isEmpty()) return;

		List<String> uniqueRoleIds = superAdminAuths.stream()
				.map(RoleAuthDto::getRoleId)
				.distinct()
				.toList();
		
		for (String roleId : uniqueRoleIds) {
			RoleAuthDto newAuth = new RoleAuthDto();
			newAuth.setCoId(coId);
			newAuth.setRoleId(roleId);
			newAuth.setPgmId(targetPgmId);
			newAuth.setPermId(targetPermId);
			newAuth.setActiveYn("Y");
			newAuth.setCreUsrId(usrId);
			newAuth.setUpdUsrId(usrId);
			roleMapper.mergeRoleAuth(newAuth);
		}
	}
}
