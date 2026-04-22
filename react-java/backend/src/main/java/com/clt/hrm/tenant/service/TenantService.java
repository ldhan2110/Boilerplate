package com.clt.hrm.tenant.service;

import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.tenant.entity.TenantDbConfig;
import com.clt.hrm.tenant.entity.TenantModuleInfo;
import com.clt.hrm.tenant.mapper.TenantServiceMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Service for tenant-related operations including module validation,
 * service bean name resolution, and database configuration retrieval.
 */
@Slf4j
@Service
public class TenantService {
    
    @Autowired
    private TenantServiceMapper tenantServiceMapper;
    
    /**
     * Validate if a module is enabled and valid for a tenant.
     * 
     * Validation checks:
     * 1. Tenant exists and is active (TENT_MST.use_flg = 'Y')
     * 2. Module exists for tenant
     * 3. Module use_flg = 'Y'
     * 4. Current date is between vld_fm and vld_to
     * 
     * @param tenantId Tenant ID
     * @param moduleCode Module code
     * @return true if module is valid and enabled, false otherwise
     * @throws BizException if tenant is not found or not active
     */
    public boolean validateModule(String tenantId, String moduleCode) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("[TenantService] Module validation failed: tenantId is null or empty");
            return false;
        }
        
        if (moduleCode == null || moduleCode.trim().isEmpty()) {
            log.warn("[TenantService] Module validation failed: moduleCode is null or empty");
            return false;
        }
        
        // Check if tenant exists and is active
        boolean isTenantActive = tenantServiceMapper.isTenantActive(tenantId);
        if (!isTenantActive) {
            log.warn("[TenantService] Module validation failed: Tenant {} is not found or not active", tenantId);
            throw new BizException(
                "[SERVICE_UNAVAILABLE]",
                "Tenant " + tenantId + " is not found or not active",
                "Tenant " + tenantId + " is not found or not active",
                HttpStatus.SERVICE_UNAVAILABLE
            );
        }

        TenantModuleInfo moduleInfo = tenantServiceMapper.selectModuleInfo(tenantId, moduleCode);
        if (moduleInfo == null) {
            log.debug("[TenantService] Module validation failed: Module {} not found for tenant {}", moduleCode, tenantId);
            return false;
        }
        
        // Check module use flag
        if (!"Y".equalsIgnoreCase(moduleInfo.getUseFlg())) {
            log.debug("[TenantService] Module validation failed: Module {} is disabled for tenant {}", moduleCode, tenantId);
            return false;
        }
        
        // Check validity dates
        LocalDate currentDate = LocalDate.now();
        LocalDate validityFrom = moduleInfo.getValidityFrom();
        LocalDate validityTo = moduleInfo.getValidityTo();
        
        if (validityFrom != null && currentDate.isBefore(validityFrom)) {
            log.debug("[TenantService] Module validation failed: Module {} validity period not started for tenant {}. Current: {}, Valid from: {}", 
                moduleCode, tenantId, currentDate, validityFrom);
            return false;
        }
        
        if (validityTo != null && currentDate.isAfter(validityTo)) {
            log.debug("[TenantService] Module validation failed: Module {} validity period expired for tenant {}. Current: {}, Valid to: {}", 
                moduleCode, tenantId, currentDate, validityTo);
            return false;
        }
        return true;
    }
    
    /**
     * Get service bean name for a tenant and service code.
     * 
     * @param tenantId Tenant ID
     * @param serviceCode Service code
     * @return Bean name or null if not found
     */
    public String getServiceBeanName(String tenantId, String serviceCode) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("getServiceBeanName: tenantId is null or empty");
            return null;
        }
        
        if (serviceCode == null || serviceCode.trim().isEmpty()) {
            log.warn("getServiceBeanName: serviceCode is null or empty");
            return null;
        }
        
        try {
            return tenantServiceMapper.getServiceBeanName(tenantId, serviceCode);
        } catch (Exception e) {
            log.error("Error getting service bean name for tenantId: {}, serviceCode: {}", tenantId, serviceCode, e);
            return null;
        }
    }
    
    /**
     * Get tenant database configuration.
     * 
     * @param tenantId Tenant ID
     * @return TenantDbConfig or null if not found
     */
    public TenantDbConfig getTenantDbConfig(String tenantId) {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("getTenantDbConfig: tenantId is null or empty");
            return null;
        }
        
        try {
            return tenantServiceMapper.selectTenantDbConfig(tenantId);
        } catch (Exception e) {
            log.error("Error getting tenant DB config for tenantId: {}", tenantId, e);
            return null;
        }
    }
}
