package com.clt.hrm.infra.tracking.interceptor;

import com.clt.hrm.infra.tracking.service.TrackingService;
import com.clt.hrm.tenant.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Set;

/**
 * Async request interceptor that captures module usage, active user data, and DAU data
 * on every HRM-X API call without adding latency.
 *
 * All Redis writes are dispatched asynchronously via the trackingExecutor thread pool.
 * The interceptor is a no-op (bean absent) when tracking.enabled=false.
 *
 * Tracked module paths: /api/{emp,att,prl,adm,sys,com}/* (excluding auth, file, assistant sub-paths)
 * Non-module paths (actuator, auth, file, assistant) are skipped silently.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "tracking.enabled", havingValue = "true", matchIfMissing = false)
public class TrackingInterceptor implements HandlerInterceptor {

	private static final Set<String> TRACKED_MODULES = Set.of("emp", "att", "prl", "adm", "sys", "com");

	// Paths excluded from tracking even if the module segment is a known module.
	// These correspond to TrackingConfig.excludePathPatterns and are also guarded
	// here for defensive correctness (e.g. direct interceptor unit tests).
	private static final Set<String> EXCLUDED_PREFIXES = Set.of(
			"/api/adm/auth/",
			"/api/com/file/",
			"/api/assistant/");

	@Autowired
	private TrackingService trackingService;

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		try {
			String path = request.getRequestURI();

			String module = extractModule(path);
			if (module == null) {
				return true;
			}

			String tenantId = TenantContext.getTenant();
			if (tenantId == null || tenantId.isBlank()) {
				return true;
			}

			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			if (authentication == null) {
				return true;
			}

			String userId = authentication.getName();
			if (userId == null || userId.isBlank()) {
				return true;
			}

			trackingService.recordAsync(tenantId, userId, module);
		} catch (Exception e) {
			// Non-blocking: never fail the request due to tracking errors
			log.warn("Tracking interceptor error (non-fatal): {}", e.getMessage());
		}
		return true;
	}

	/**
	 * Extracts the module code from the request path.
	 * Returns the uppercase module code (e.g. "EMP") if the path segment is a tracked module
	 * and the path is not in the excluded prefix list.
	 * Returns null for auth, file, assistant, actuator, or unknown-module paths.
	 *
	 * @param path request URI (e.g. "/api/emp/employee/getList")
	 * @return uppercase module code or null
	 */
	public String extractModule(String path) {
		if (path == null) {
			return null;
		}

		// Skip explicitly excluded sub-paths (auth, file upload, assistant)
		for (String prefix : EXCLUDED_PREFIXES) {
			if (path.startsWith(prefix)) {
				return null;
			}
		}
		// Also handle exact matches without trailing slash
		if (path.equals("/api/adm/auth") || path.equals("/api/com/file") || path.equals("/api/assistant")) {
			return null;
		}

		String[] segments = path.split("/");
		// Expected format: "" / "api" / "{module}" / ...
		if (segments.length >= 3 && "api".equals(segments[1])) {
			String candidate = segments[2].toLowerCase();
			if (TRACKED_MODULES.contains(candidate)) {
				return candidate.toUpperCase();
			}
		}
		return null;
	}
}
