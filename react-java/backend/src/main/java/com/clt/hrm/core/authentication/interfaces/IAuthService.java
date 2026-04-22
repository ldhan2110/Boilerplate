package com.clt.hrm.core.authentication.interfaces;

import com.clt.hrm.core.authentication.dtos.LoginRequestDto;
import com.clt.hrm.core.authentication.dtos.LoginResponseDto;
import com.clt.hrm.core.authentication.dtos.RefreshTokenRequestDto;
import com.clt.hrm.core.authentication.dtos.RefreshTokenResponseDto;
import com.clt.hrm.core.authentication.dtos.RoleInfoDto;
import com.clt.hrm.core.authentication.entities.UserInfo;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.userdetails.UserDetailsService;

public interface IAuthService extends UserDetailsService {
	UserInfo loadUserByUsername(String username);
	LoginResponseDto authenticate(LoginRequestDto request);
	RefreshTokenResponseDto generateAccessToken(RefreshTokenRequestDto request);
	RoleInfoDto getUserRole();
	void logout(HttpServletRequest request);
}
