package com.clt.hrm.tenant.exception;

/**
 * Exception thrown when tenant database connection pool is exhausted
 */
public class TenantPoolExhaustedException extends RuntimeException {
    private final String tenantId;
    
    public TenantPoolExhaustedException(String tenantId) {
        super("Connection pool exhausted for tenant: " + tenantId);
        this.tenantId = tenantId;
    }
    
    public TenantPoolExhaustedException(String tenantId, Throwable cause) {
        super("Connection pool exhausted for tenant: " + tenantId, cause);
        this.tenantId = tenantId;
    }
    
    public String getTenantId() {
        return tenantId;
    }
}
