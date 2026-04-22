package com.clt.hrm.application.resolvers.authentication;

import com.clt.hrm.core.authentication.interfaces.IAuthService;
import com.clt.hrm.core.authentication.service.AuthService;
import com.clt.hrm.application.resolvers.ServiceCode;
import com.clt.hrm.application.resolvers.ServiceResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Resolver for AuthService that provides tenant-specific implementations.
 */
@Component
public class AuthServiceResolver {
    
    @Autowired
    private ServiceResolver serviceResolver;
    
    @Autowired
    private AuthService defaultService;
    
    /**
     * Get the appropriate AuthService implementation for the current tenant.
     * 
     * @return IAuthService implementation (custom or default)
     */
    public IAuthService getService() {
        return serviceResolver.resolve(
            ServiceCode.AUTH,
            IAuthService.class,
            defaultService
        );
    }
}
