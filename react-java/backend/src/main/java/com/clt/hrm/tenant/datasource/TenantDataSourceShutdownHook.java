package com.clt.hrm.tenant.datasource;

import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Shutdown hook to gracefully close all tenant DataSources on application shutdown
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "tenant.datasource.enabled", havingValue = "true", matchIfMissing = true)
public class TenantDataSourceShutdownHook {
    
    private final TenantDataSourceManager tenantDataSourceManager;
    
    @Autowired
    public TenantDataSourceShutdownHook(TenantDataSourceManager tenantDataSourceManager) {
        this.tenantDataSourceManager = tenantDataSourceManager;
    }
    
    @PreDestroy
    public void shutdown() {
        log.info("Application shutting down. Closing all tenant DataSources...");
        tenantDataSourceManager.shutdownAll();
    }
}
