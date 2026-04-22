package com.clt.hrm.application.resolvers.administration.role;

import com.clt.hrm.core.administration.role.interfaces.IAdmRoleService;
import com.clt.hrm.core.administration.role.service.AdmRoleService;
import com.clt.hrm.application.resolvers.ServiceCode;
import com.clt.hrm.application.resolvers.ServiceResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Resolver for AdmRoleService that provides tenant-specific implementations.
 */
@Component
public class AdmRoleServiceResolver {
    
    @Autowired
    private ServiceResolver serviceResolver;
    
    @Autowired
    private AdmRoleService defaultService;
    
    /**
     * Get the appropriate AdmRoleService implementation for the current tenant.
     * 
     * @return IAdmRoleService implementation (custom or default)
     */
    public IAdmRoleService getService() {
        return serviceResolver.resolve(
            ServiceCode.ADM_ROLE,
            IAdmRoleService.class,
            defaultService
        );
    }
}
