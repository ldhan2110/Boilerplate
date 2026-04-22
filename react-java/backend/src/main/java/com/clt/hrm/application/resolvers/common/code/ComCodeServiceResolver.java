package com.clt.hrm.application.resolvers.common.code;

import com.clt.hrm.core.common.code.interfaces.IComCodeService;
import com.clt.hrm.core.common.code.service.ComCodeService;
import com.clt.hrm.application.resolvers.ServiceCode;
import com.clt.hrm.application.resolvers.ServiceResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Resolver for ComCodeService that provides tenant-specific implementations.
 */
@Component
public class ComCodeServiceResolver {
    
    @Autowired
    private ServiceResolver serviceResolver;
    
    @Autowired
    private ComCodeService defaultService;
    
    /**
     * Get the appropriate ComCodeService implementation for the current tenant.
     * 
     * @return IComCodeService implementation (custom or default)
     */
    public IComCodeService getService() {
        return serviceResolver.resolve(
            ServiceCode.COM_CODE,
            IComCodeService.class,
            defaultService
        );
    }
}
