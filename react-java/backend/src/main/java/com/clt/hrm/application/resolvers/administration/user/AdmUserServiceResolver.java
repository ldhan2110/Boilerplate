package com.clt.hrm.application.resolvers.administration.user;

import com.clt.hrm.core.administration.user.interfaces.IAdmUserService;
import com.clt.hrm.core.administration.user.service.AdmUserService;
import com.clt.hrm.application.resolvers.ServiceCode;
import com.clt.hrm.application.resolvers.ServiceResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Resolver for AdmUserService that provides tenant-specific implementations.
 */
@Component
public class AdmUserServiceResolver {
    
    @Autowired
    private ServiceResolver serviceResolver;
    
    @Autowired
    private AdmUserService defaultService;
    
    /**
     * Get the appropriate AdmUserService implementation for the current tenant.
     * 
     * @return IAdmUserService implementation (custom or default)
     */
    public IAdmUserService getService() {
        return serviceResolver.resolve(
            ServiceCode.ADM_USER,
            IAdmUserService.class,
            defaultService
        );
    }
}
