package com.clt.hrm.tenant;

/**
 * Thread-local context for storing current tenant ID.
 * Used by TenantRoutingDataSource to route database operations to the correct tenant database.
 */
public class TenantContext {
    private static final ThreadLocal<String> TENANT = new ThreadLocal<>();

    private TenantContext() {}

    /**
     * Set the current tenant ID for this thread
     * @param tenantId Company ID (CO_ID)
     */
    public static void setTenant(String tenantId) {
        TENANT.set(tenantId);
    }

    /**
     * Get the current tenant ID for this thread
     * @return Tenant ID (Company ID) or null if not set
     */
    public static String getTenant() {
        return TENANT.get();
    }

    /**
     * Clear the tenant context for this thread
     * Should be called after request completion to prevent memory leaks
     */
    public static void clear() {
        TENANT.remove();
    }
    
    /**
     * Check if tenant context is set
     * @return true if tenant is set, false otherwise
     */
    public static boolean hasTenant() {
        String tenant = TENANT.get();
        return tenant != null && !tenant.trim().isEmpty();
    }
    
    /**
     * Validate tenant ID format
     * @param tenantId Tenant ID to validate
     * @return true if valid, false otherwise
     */
    public static boolean isValidTenantId(String tenantId) {
        return tenantId != null && !tenantId.trim().isEmpty();
    }
}
