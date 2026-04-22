package com.clt.hrm.application.controllers.authentication;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clt.hrm.core.authentication.dtos.LoginRequestDto;
import com.clt.hrm.core.authentication.dtos.LoginResponseDto;
import com.clt.hrm.core.authentication.dtos.RefreshTokenRequestDto;
import com.clt.hrm.core.authentication.dtos.RefreshTokenResponseDto;
import com.clt.hrm.core.authentication.dtos.RoleInfoDto;
import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.application.resolvers.authentication.AuthServiceResolver;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/adm/auth")
public class AuthController {
	@Autowired
	private AuthServiceResolver serviceResolver;

	@PostMapping("login")
	public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto request) {
		return ResponseEntity.ok(serviceResolver.getService().authenticate(request));
	}
	
	@PostMapping("logout")
	public ResponseEntity<SuccessDto> logout(HttpServletRequest request) {
	    serviceResolver.getService().logout(request);
	    return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	@PostMapping("refresh-token")
	public ResponseEntity<RefreshTokenResponseDto> refresh(@RequestBody RefreshTokenRequestDto request) {
		return ResponseEntity.ok(serviceResolver.getService().generateAccessToken(request));
	}
	
	@GetMapping("getUserRole")
	public ResponseEntity<RoleInfoDto> getUserRole() {
		return ResponseEntity.ok(serviceResolver.getService().getUserRole());
	}

}
