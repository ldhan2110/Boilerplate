package com.clt.hrm.application.resolvers.administration.company;

import com.clt.hrm.core.administration.company.interfaces.IAdmCompanyService;
import com.clt.hrm.core.administration.company.service.AdmCompanyService;
import com.clt.hrm.application.resolvers.ServiceCode;
import com.clt.hrm.application.resolvers.ServiceResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Resolver for AdmCompanyService that provides tenant-specific implementations.
 */
@Component
public class AdmCompanyServiceResolver {
    
    @Autowired
    private ServiceResolver serviceResolver;
    
    @Autowired
    private AdmCompanyService defaultService;
    
    /**
     * Get the appropriate AdmCompanyService implementation for the current tenant.
     * 
     * @return IAdmCompanyService implementation (custom or default)
     */
    public IAdmCompanyService getService() {
        return serviceResolver.resolve(
            ServiceCode.ADM_COMPANY,
            IAdmCompanyService.class,
            defaultService
        );
    }
}
