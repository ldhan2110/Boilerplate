package com.clt.hrm.application.resolvers.system.email;

import com.clt.hrm.infra.email.services.EmailService;
import com.clt.hrm.application.resolvers.ServiceCode;
import com.clt.hrm.application.resolvers.ServiceResolver;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class EmailManagementServiceResolver {

    @Autowired
    private ServiceResolver serviceResolver;

    @Autowired
    private EmailService defaultService;

    public EmailService getService() {
        return serviceResolver.resolve(
            ServiceCode.SYS_EMAIL,
            EmailService.class,
            defaultService
        );
    }
}
