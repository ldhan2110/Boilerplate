package com.clt.hrm.application.resolvers;

import com.clt.hrm.tenant.TenantContext;
import com.clt.hrm.tenant.service.TenantService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Component;

/**
 * Base service resolver that dynamically resolves tenant-specific service implementations.
 * 
 * Resolution flow:
 * 1. Get tenant ID from TenantContext
 * 2. Query TenantService for custom bean name
 * 3. If custom bean found, retrieve from ApplicationContext
 * 4. If not found or tenant context not set, return default service
 */
@Slf4j
@Component
public class ServiceResolver {
    
    @Autowired
    private TenantService tenantService;
    
    @Autowired
    private ApplicationContext applicationContext;
    
    /**
     * Resolve service implementation for current tenant.
     * 
     * @param serviceCode Service code constant (e.g., ServiceCode.ADM_COMPANY)
     * @param serviceInterface Service interface class for type safety
     * @param defaultService Default service implementation to use as fallback
     * @param <T> Service interface type
     * @return Resolved service implementation (custom or default)
     */
    public <T> T resolve(String serviceCode, Class<T> serviceInterface, T defaultService) {
        try {
            // Get tenant ID from context
            String tenantId = TenantContext.getTenant();
            
            // If no tenant context, use default service
            if (tenantId == null || tenantId.trim().isEmpty()) {
                log.debug("No tenant context set, using default service for serviceCode: {}", serviceCode);
                return defaultService;
            }
            
            // Query for custom bean name
            String customBeanName = null;
            try {
                customBeanName = tenantService.getServiceBeanName(tenantId, serviceCode);
            } catch (Exception e) {
                log.warn("Error querying custom service implementation for tenantId: {}, serviceCode: {}. Using default service.", 
                    tenantId, serviceCode, e);
                return defaultService;
            }
            
            // If no custom implementation found, use default
            if (customBeanName == null || customBeanName.trim().isEmpty()) {
                log.debug("No custom implementation found for tenantId: {}, serviceCode: {}. Using default service.", 
                    tenantId, serviceCode);
                return defaultService;
            }
            
            // Try to get custom bean from ApplicationContext
            try {
                Object customBean = applicationContext.getBean(customBeanName);
                
                // Verify bean implements the expected interface
                if (!serviceInterface.isAssignableFrom(customBean.getClass())) {
                    log.error("Custom bean '{}' does not implement interface {}. Using default service.", 
                        customBeanName, serviceInterface.getName());
                    return defaultService;
                }
                
                T resolvedService = serviceInterface.cast(customBean);
                log.debug("Resolved custom service implementation '{}' for tenantId: {}, serviceCode: {}", 
                    customBeanName, tenantId, serviceCode);
                return resolvedService;
                
            } catch (BeansException e) {
                log.error("Custom bean '{}' not found in ApplicationContext for tenantId: {}, serviceCode: {}. Using default service.", 
                    customBeanName, tenantId, serviceCode, e);
                return defaultService;
            }
            
        } catch (Exception e) {
            log.error("Unexpected error resolving service for serviceCode: {}. Using default service.", 
                serviceCode, e);
            return defaultService;
        }
    }
}
