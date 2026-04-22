package com.clt.hrm.infra.configs.security.filters;

import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.core.authentication.service.AuthCacheService;
import com.clt.hrm.core.authentication.service.AuthService;
import com.clt.hrm.infra.configs.security.utils.JwtUtils;
import com.clt.hrm.tenant.TenantContext;
import org.slf4j.MDC;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
@ConditionalOnProperty(value = "keycloak.enabled", havingValue = "false", matchIfMissing = true)
public class JwtAuthenticationFilter extends OncePerRequestFilter {
	@Autowired
	private JwtUtils jwtUtil;

	@Autowired
	private AuthService authService;

	@Autowired(required = false)
	private AuthCacheService authCacheService;

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		String token = jwtUtil.getTokenFromRequest(request);

		if (token != null) {
			try {
				String username = jwtUtil.extractUsername(token);

				if (username != null && jwtUtil.validateToken(token, username)) {
					UserInfo userDetails = null;

					// If Redis cache is available, try to use it
					if (authCacheService != null) {
						
						// Check if token is blacklisted
		                if (authCacheService.isTokenBlacklisted(token)) {
		                    log.warn("[CACHE ERROR] Attempt to use blacklisted token");
		                    // Manually send 401 response
		                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		                    response.setContentType("application/json");
		                    response.getWriter().write("{\"error\": \"Token is blacklisted. Please login again.\"}");
		                    response.getWriter().flush();
		                    return;
		                }
		                
						userDetails = authCacheService.getUserFromCache(username);

						if (userDetails == null) {
							log.info("[CACHE MISS] User not found in Redis cache. Loading from DB. Username: {}", username);
							
							String companyId;
							if (username != null && username.contains("::")) {
								companyId = username.split("::")[0];
							} else {
								companyId = username;
							}
							TenantContext.setTenant(companyId);
							MDC.put("tenant_id", companyId);
							log.debug("Tenant context set to: {}", companyId);
							userDetails = authService.loadUserByUsername(username);

							if (userDetails != null) {
								authCacheService.cacheUser(username, userDetails);
								log.info("[CACHE STORED] User '{}' stored in Redis cache", username);
							}
						} else {
							log.info("[CACHE HIT] User '{}' successfully loaded from Redis cache", username);
						}
					} else {
						// Redis cache not available, load directly from DB
						log.info("[NO CACHE] Redis cache not available. Loading user from DB. Username: {}", username);
						userDetails = authService.loadUserByUsername(username);
					}

					if (userDetails != null) {
						UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
								userDetails, null, userDetails.getAuthorities());
						SecurityContextHolder.getContext().setAuthentication(authentication);
						
						// Set tenant context from user's company ID
						if (userDetails.getCoId() != null && !userDetails.getCoId().trim().isEmpty()) {
							TenantContext.setTenant(userDetails.getCoId());
							MDC.put("tenant_id", userDetails.getCoId());
							log.debug("Tenant context set to: {}", userDetails.getCoId());
						}
					}
				}
			} catch (Exception e) {
				log.error("Error during JWT authentication for token", e);
				SecurityContextHolder.clearContext();
				TenantContext.clear();
			}
		}

		try {
			filterChain.doFilter(request, response);
		} finally {
			// Clear tenant context after request completes
			TenantContext.clear();
			MDC.clear();
		}
	}
}
