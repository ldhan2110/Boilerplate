package com.clt.hrm.tenant.aspects;

import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.tenant.TenantContext;
import com.clt.hrm.tenant.annotations.ModuleValid;
import com.clt.hrm.tenant.service.TenantService;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Aspect for validating module access based on @ModuleValid annotation.
 * Validates that the tenant has access to the module before method execution.
 */
@Slf4j
@Aspect
@Component
public class TenantValidationAspect {
    
    @Autowired
    private TenantService tenantService;
    
    /**
     * Pointcut for methods annotated with @ModuleValid
     */
    @Pointcut("@annotation(moduleValid)")
    public void methodWithModuleValid(ModuleValid moduleValid) {}
    
    /**
     * Pointcut for methods in classes annotated with @ModuleValid
     */
    @Pointcut("@within(moduleValid)")
    public void classWithModuleValid(ModuleValid moduleValid) {}
    
    /**
     * Around advice to validate module access before method execution.
     * Handles both method-level and class-level @ModuleValid annotations.
     */
    @Around("methodWithModuleValid(moduleValid) || classWithModuleValid(moduleValid)")
    public Object validateModule(ProceedingJoinPoint joinPoint, ModuleValid moduleValid) throws Throwable {
        // Skip validation if skip flag is set
        if (moduleValid.skip()) {
            log.debug("[TenantValidationAspect] Skipping module validation for {}", joinPoint.getSignature());
            return joinPoint.proceed();
        }
        
        // Get tenant ID from context
        String tenantId = TenantContext.getTenant();
        if (tenantId == null || tenantId.trim().isEmpty()) {
            log.warn("[TenantValidationAspect] No tenant context found for method: {}", joinPoint.getSignature());
            throw new IllegalStateException("Tenant context is not set");
        }
        
        // Get module code from annotation
        String moduleCode = moduleValid.moduleCode();
        if (moduleCode == null || moduleCode.trim().isEmpty()) {
            log.warn("[TenantValidationAspect] Module code is empty in annotation for method: {}", joinPoint.getSignature());
            throw new IllegalArgumentException("Module code is required in @ModuleValid annotation");
        }
        
        // Validate module access
        boolean isValid = tenantService.validateModule(tenantId, moduleCode);
        if (!isValid) {
            log.warn("[TenantValidationAspect] Module validation failed for tenant: {}, module: {}, method: {}", tenantId, moduleCode, joinPoint.getSignature());
            throw new BizException("SERVICE_UNAVAILABLE", "[SERVICE_UNAVAILABLE] Module " + moduleCode + " is not available for tenant " + tenantId, "Module " + moduleCode + " is not available for tenant " + tenantId, HttpStatus.SERVICE_UNAVAILABLE);
        }
        
        log.debug("[TenantValidationAspect] Module validation passed for tenant: {}, module: {}, method: {}", 
            tenantId, moduleCode, joinPoint.getSignature());
        
        // Proceed with method execution
        return joinPoint.proceed();
    }
}
