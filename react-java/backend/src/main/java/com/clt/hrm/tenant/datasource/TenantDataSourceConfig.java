package com.clt.hrm.tenant.datasource;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * Configuration for tenant routing DataSource.
 * Makes TenantRoutingDataSource the primary DataSource for the application.
 * Note: This will override Spring Boot's auto-configured DataSource.
 */
@Configuration
@ConditionalOnProperty(name = "tenant.datasource.enabled", havingValue = "true", matchIfMissing = true)
public class TenantDataSourceConfig {
    
    @Autowired
    private TenantRoutingDataSource tenantRoutingDataSource;
    
    /**
     * Make TenantRoutingDataSource the primary DataSource
     * This ensures all MyBatis operations (except TenantDbConfigMapper) use tenant routing
     */
    @Bean(name = "dataSource")
    @Primary
    @DependsOn({"tenantRoutingDataSource", "metadataDataSource"})
    public DataSource dataSource() {
        return tenantRoutingDataSource;
    }
}
