package com.clt.hrm.tenant.exception;

/**
 * Exception thrown when connection to tenant database fails
 */
public class TenantConnectionException extends RuntimeException {
    private final String tenantId;
    
    public TenantConnectionException(String tenantId, String message) {
        super("Failed to connect to tenant database for tenant " + tenantId + ": " + message);
        this.tenantId = tenantId;
    }
    
    public TenantConnectionException(String tenantId, String message, Throwable cause) {
        super("Failed to connect to tenant database for tenant " + tenantId + ": " + message, cause);
        this.tenantId = tenantId;
    }
    
    public String getTenantId() {
        return tenantId;
    }
}
