package com.clt.hrm.infra.configs.security.filters;

import com.clt.hrm.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Slf4j
@Component
public class PublicApiAuthFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-API-Key";
    private static final String TENANT_ID_HEADER = "X-Tenant-Id";
    private static final String PUBLIC_API_PATH = "/publicApi/";

    @Value("${public-api.secret:}")
    private String apiSecret;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith(PUBLIC_API_PATH);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        if (apiSecret == null || apiSecret.isBlank()) {
            log.warn("public-api.secret is not configured. Rejecting all publicApi requests.");
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid API key");
            return;
        }

        String providedKey = request.getHeader(API_KEY_HEADER);

        if (providedKey == null || providedKey.isBlank()) {
            log.warn("Missing X-API-Key header for publicApi request: {}", request.getRequestURI());
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Missing API key");
            return;
        }

        if (!MessageDigest.isEqual(apiSecret.getBytes(StandardCharsets.UTF_8), providedKey.getBytes(StandardCharsets.UTF_8))) {
            log.warn("Invalid X-API-Key for publicApi request: {}", request.getRequestURI());
            sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid API key");
            return;
        }

        String tenantId = request.getHeader(TENANT_ID_HEADER);
        if (tenantId == null || tenantId.isBlank()) {
            log.warn("Missing X-Tenant-Id header for publicApi request: {}", request.getRequestURI());
            sendError(response, HttpServletResponse.SC_BAD_REQUEST, "Missing X-Tenant-Id header");
            return;
        }

        TenantContext.setTenant(tenantId.trim());
        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private void sendError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
        response.getWriter().flush();
    }
}
