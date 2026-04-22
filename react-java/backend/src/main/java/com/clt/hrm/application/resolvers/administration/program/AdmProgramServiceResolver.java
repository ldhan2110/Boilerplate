package com.clt.hrm.application.resolvers.administration.program;

import com.clt.hrm.core.administration.program.interfaces.IAdmProgramService;
import com.clt.hrm.core.administration.program.service.AdmProgramService;
import com.clt.hrm.application.resolvers.ServiceCode;
import com.clt.hrm.application.resolvers.ServiceResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Resolver for AdmProgramService that provides tenant-specific implementations.
 */
@Component
public class AdmProgramServiceResolver {
    
    @Autowired
    private ServiceResolver serviceResolver;
    
    @Autowired
    private AdmProgramService defaultService;
    
    /**
     * Get the appropriate AdmProgramService implementation for the current tenant.
     * 
     * @return IAdmProgramService implementation (custom or default)
     */
    public IAdmProgramService getService() {
        return serviceResolver.resolve(
            ServiceCode.ADM_PROGRAM,
            IAdmProgramService.class,
            defaultService
        );
    }
}
