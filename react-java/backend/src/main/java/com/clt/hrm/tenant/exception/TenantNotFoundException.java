package com.clt.hrm.tenant.exception;

/**
 * Exception thrown when a tenant is not found in the metadata database
 */
public class TenantNotFoundException extends RuntimeException {
    private final String tenantId;
    
    public TenantNotFoundException(String tenantId) {
        super("Tenant database configuration not found for tenant: " + tenantId);
        this.tenantId = tenantId;
    }
    
    public TenantNotFoundException(String tenantId, Throwable cause) {
        super("Tenant database configuration not found for tenant: " + tenantId, cause);
        this.tenantId = tenantId;
    }
    
    public String getTenantId() {
        return tenantId;
    }
}
