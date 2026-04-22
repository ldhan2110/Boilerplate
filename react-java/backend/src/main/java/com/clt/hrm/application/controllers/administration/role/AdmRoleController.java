package com.clt.hrm.application.controllers.administration.role;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clt.hrm.core.administration.role.dtos.RoleDto;
import com.clt.hrm.core.administration.role.dtos.RoleListDto;
import com.clt.hrm.core.administration.role.dtos.SearchRoleDto;
import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.application.resolvers.administration.role.AdmRoleServiceResolver;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/adm/role")
@Tag(name = "User Management", description = "Operations related to role management")
public class AdmRoleController {
	@Autowired
	private AdmRoleServiceResolver serviceResolver;
	
	@PostMapping("/getRoleList")
	public ResponseEntity<RoleListDto> getRoleList(@Valid @RequestBody SearchRoleDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getRoleList(request));
	}
	
	@PostMapping("/getRole")
	public ResponseEntity<RoleDto> getRole(@Valid @RequestBody SearchRoleDto request) {
		return ResponseEntity.ok(serviceResolver.getService().getRole(request));
	}
	
	@PostMapping("/insertRole")
	public ResponseEntity<SuccessDto> insertRole(@RequestBody RoleDto request) {
		serviceResolver.getService().insertRole(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
	
	@PostMapping("/updateRole")
	public ResponseEntity<SuccessDto> updateRole(@RequestBody RoleDto request) {
		serviceResolver.getService().updateRole(request);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
}
