package com.clt.hrm.core.authentication.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.clt.hrm.core.authentication.dtos.LoginRequestDto;
import com.clt.hrm.core.authentication.dtos.LoginResponseDto;
import com.clt.hrm.core.authentication.dtos.RefreshTokenRequestDto;
import com.clt.hrm.core.authentication.dtos.RefreshTokenResponseDto;
import com.clt.hrm.core.authentication.dtos.RoleInfoDto;
import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.core.authentication.mapper.AuthMapper;
import com.clt.hrm.core.authentication.interfaces.IAuthService;
import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.utils.CommonFunction;
import com.clt.hrm.infra.configs.security.utils.JwtUtils;
import com.clt.hrm.tenant.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AuthService implements IAuthService {
	@Autowired
	private AuthMapper authMapper;

	@Lazy
	@Autowired
	private AuthenticationManager authenticationManager;
	
	@Autowired(required = false)
	private AuthCacheService authCacheService;

	@Autowired
	private JwtUtils jwtUtils;

	@Override
	public UserInfo loadUserByUsername(String username) throws UsernameNotFoundException {
		UserInfo userInfo = authMapper.loadUserByUsername(username);
		if (userInfo == null) {
			throw new UsernameNotFoundException("User not found");
		}
		return userInfo;
	}

	public LoginResponseDto authenticate(LoginRequestDto request) {
		// Extract company ID from username format: "companyId::username"
		String companyId = null;
		if (request.getUsername() != null && request.getUsername().contains("::")) {
			companyId = request.getUsername().split("::")[0];
		} else {
			// If username doesn't contain "::", try to use the whole username as company ID
			// This handles cases where username might just be the company ID
			companyId = request.getUsername();
		}
		
		// Set tenant context BEFORE authentication so database queries route to correct tenant
		if (companyId != null && !companyId.trim().isEmpty()) {
			TenantContext.setTenant(companyId);
			log.debug("Tenant context set to: {} for login", companyId);
		}
		
		try {
			Authentication authentication = authenticationManager
					.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
			
			if (authMapper.isActiveCompany(companyId) == null) {
				throw new BizException("INACTIVE_COMPANY", null, "Company is not active", HttpStatus.FORBIDDEN);
			}
			if (authMapper.isActiveUser(request.getUsername()) == null) {
				throw new BizException("INACTIVE_USER", null, "User is not active", HttpStatus.FORBIDDEN);
			}

			// Store authentication into SecurityContextHolder
			SecurityContextHolder.getContext().setAuthentication(authentication);

			// Generate Token
			UserInfo userInfo = (UserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
			LoginResponseDto response = new LoginResponseDto();
			response.setAccessToken(jwtUtils.generateToken(request.getUsername(), userInfo));
			response.setAccessExpireIn(jwtUtils.getAccessExpireTime());
			response.setRefreshToken(jwtUtils.generateRefreshToken(request.getUsername()));
			response.setRefreshExpireIn(jwtUtils.getRefreshExpireTime());
			
			 // Register token to cached if REDIS is available
		    if (authCacheService != null) {
		    	authCacheService.registerUserToken(request.getUsername(), response.getAccessToken());
		    }
			return response;
		} finally {
			// Clear tenant context after login attempt
			TenantContext.clear();
		}
	}

	public RefreshTokenResponseDto generateAccessToken(RefreshTokenRequestDto request) {
		String refreshToken = request.getRefreshToken();
		if (jwtUtils.validateRefreshToken(refreshToken)) {
			String username = jwtUtils.extractUsernameForRefreshToken(refreshToken);
			
			// Extract company ID from username and set tenant context
			String companyId = null;
			if (username != null && username.contains("::")) {
				companyId = username.split("::")[0];
			} else {
				companyId = username;
			}
			
			if (companyId != null && !companyId.trim().isEmpty()) {
				TenantContext.setTenant(companyId);
				log.debug("Tenant context set to: {} for token refresh", companyId);
			}
			
			try {
				UserInfo userInfo = authMapper.loadUserByUsername(username);

				RefreshTokenResponseDto response = new RefreshTokenResponseDto();

				String newAccessToken = jwtUtils.generateToken(username, userInfo);
				String newRefreshToken = jwtUtils.generateRefreshToken(username);

				// generate new access and refresh token
				response.setAccessToken(newAccessToken);
				response.setAccessExpireIn(jwtUtils.getAccessExpireTime());
				response.setRefreshToken(newRefreshToken);
				response.setRefreshExpireIn(jwtUtils.getRefreshExpireTime());
				return response;
			} finally {
				TenantContext.clear();
			}
		}
		return null;
	}
	
	public RoleInfoDto getUserRole() {
		UserInfo usr = CommonFunction.getUserInfo();
		RoleInfoDto roleInfo = authMapper.getUserRole(usr.getCoId(), usr.getRoleId());
		if (roleInfo != null) {
			roleInfo.setRoleAuthList(authMapper.getUserRoleAuth(usr.getCoId(), usr.getRoleId()));
		};
		return roleInfo;
	}

	public void logout(HttpServletRequest request) {
		String token = jwtUtils.getTokenFromRequest(request);
	    String username = SecurityContextHolder.getContext().getAuthentication().getName();
	    if (authCacheService != null) {
	    	authCacheService.logout(token, username);
	    }
	    SecurityContextHolder.clearContext();
	}	
}
