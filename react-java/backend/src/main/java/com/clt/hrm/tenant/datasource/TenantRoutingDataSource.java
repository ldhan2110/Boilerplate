package com.clt.hrm.tenant.datasource;

import com.clt.hrm.tenant.TenantContext;
import com.clt.hrm.tenant.exception.TenantConnectionException;
import com.clt.hrm.tenant.exception.TenantNotFoundException;
import com.clt.hrm.tenant.exception.TenantPoolExhaustedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.DependsOn;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.datasource.lookup.AbstractRoutingDataSource;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Collections;

/**
 * Routing DataSource that routes MyBatis operations to the correct tenant DataSource
 * based on TenantContext. Falls back to default DataSource for non-tenant operations.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "tenant.datasource.enabled", havingValue = "true", matchIfMissing = true)
@DependsOn({"tenantDataSourceManager", "metadataDataSource"})
public class TenantRoutingDataSource extends AbstractRoutingDataSource {
    
    private final TenantDataSourceManager tenantDataSourceManager;
    private final DataSource defaultDataSource;
    
    @Autowired
    public TenantRoutingDataSource(
            TenantDataSourceManager tenantDataSourceManager,
            @org.springframework.beans.factory.annotation.Qualifier("metadataDataSource") DataSource defaultDataSource) {
        this.tenantDataSourceManager = tenantDataSourceManager;
        this.defaultDataSource = defaultDataSource;
    }
    
    @Override
    public void afterPropertiesSet() {
        // Initialize AbstractRoutingDataSource with empty map since we override determineTargetDataSource
        setTargetDataSources(Collections.emptyMap());
        setDefaultTargetDataSource(defaultDataSource);
        super.afterPropertiesSet();
    }
    
    @Override
    protected Object determineCurrentLookupKey() {
        // Return tenant ID from context, or null to use default DataSource
        String tenantId = TenantContext.getTenant();
        if (tenantId != null && !tenantId.trim().isEmpty()) {
            return tenantId;
        }
        return null; // Use default DataSource
    }
    
    @Override
    protected DataSource determineTargetDataSource() {
        Object lookupKey = determineCurrentLookupKey();
        
        // If no tenant in context, use default DataSource (for metadata operations)
        if (lookupKey == null) {
            return defaultDataSource;
        }
        
        // Get tenant-specific DataSource
        String tenantId = (String) lookupKey;
        try {
            return tenantDataSourceManager.getDataSource(tenantId);
        } catch (TenantNotFoundException e) {
            log.error("Tenant not found: {}", tenantId);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, 
                "Tenant database configuration not found for tenant: " + tenantId, e);
        } catch (TenantConnectionException e) {
            log.error("Connection failed for tenant {}: {}", tenantId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, 
                "Failed to connect to tenant database: " + e.getMessage(), e);
        } catch (TenantPoolExhaustedException e) {
            log.error("Connection pool exhausted for tenant {}: {}", tenantId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, 
                "Connection pool exhausted for tenant: " + tenantId + ". Please try again later.", e);
        } catch (SQLException e) {
            // Check for pool exhaustion SQL errors
            String errorMessage = e.getMessage();
            if (errorMessage != null && 
                (errorMessage.contains("timeout") || errorMessage.contains("pool") || 
                 errorMessage.contains("exhausted") || errorMessage.contains("Connection is not available"))) {
                log.error("Connection pool exhausted for tenant {}: {}", tenantId, e.getMessage(), e);
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, 
                    "Connection pool exhausted for tenant: " + tenantId + ". Please try again later.", e);
            }
            log.error("Failed to get DataSource for tenant {}: {}", tenantId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Database error for tenant: " + tenantId, e);
        } catch (Exception e) {
            log.error("Unexpected error getting DataSource for tenant {}: {}", tenantId, e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Unexpected error for tenant: " + tenantId, e);
        }
    }
    
    @Override
    public Connection getConnection() throws SQLException {
        return determineTargetDataSource().getConnection();
    }
    
    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return determineTargetDataSource().getConnection(username, password);
    }
}
