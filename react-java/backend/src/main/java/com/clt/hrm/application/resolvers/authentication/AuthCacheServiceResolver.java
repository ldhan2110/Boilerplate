package com.clt.hrm.application.resolvers.authentication;

import com.clt.hrm.core.authentication.interfaces.IAuthCacheService;
import com.clt.hrm.core.authentication.service.AuthCacheService;
import com.clt.hrm.application.resolvers.ServiceCode;
import com.clt.hrm.application.resolvers.ServiceResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Resolver for AuthCacheService that provides tenant-specific implementations.
 */
@Component
public class AuthCacheServiceResolver {
    
    @Autowired
    private ServiceResolver serviceResolver;
    
    @Autowired(required = false)
    private AuthCacheService defaultService;
    
    /**
     * Get the appropriate AuthCacheService implementation for the current tenant.
     * 
     * @return IAuthCacheService implementation (custom or default), or null if not available
     */
    public IAuthCacheService getService() {
        return serviceResolver.resolve(
            ServiceCode.AUTH_CACHE,
            IAuthCacheService.class,
            defaultService
        );
    }
}
