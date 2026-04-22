package com.clt.hrm.tenant.datasource;

import com.clt.hrm.tenant.entity.TenantDbConfig;
import com.clt.hrm.tenant.exception.TenantConnectionException;
import com.clt.hrm.tenant.exception.TenantNotFoundException;
import com.clt.hrm.tenant.exception.TenantPoolExhaustedException;
import com.clt.hrm.tenant.service.TenantService;
import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.DependsOn;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Manages per-tenant DataSource instances with lazy loading, caching, and connection pooling.
 * Each tenant has its own HikariCP connection pool that is created on-demand and cached for reuse.
 */
@Slf4j
@Component
@ConditionalOnProperty(name = "tenant.datasource.enabled", havingValue = "true", matchIfMissing = true)
@DependsOn({"metadataSqlSessionFactory"})
public class TenantDataSourceManager {
    
    private final TenantService tenantService;
    private final TenantDataSourceProperties properties;
    private final ConcurrentHashMap<String, DataSource> dataSourceCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> lastAccessTime = new ConcurrentHashMap<>();
    private final ReentrantLock evictionLock = new ReentrantLock();
    
    @Autowired
    public TenantDataSourceManager(
            TenantService tenantService,
            TenantDataSourceProperties properties) {
        this.tenantService = tenantService;
        this.properties = properties;
        
        // Start eviction thread
        startEvictionThread();
    }
    
    /**
     * Get DataSource for a specific tenant (lazy loading with caching)
     * @param tenantId Company ID (CO_ID)
     * @return DataSource for the tenant
     * @throws TenantNotFoundException if tenant configuration not found
     * @throws TenantConnectionException if connection fails
     * @throws TenantPoolExhaustedException if connection pool is exhausted
     * @throws SQLException for other SQL errors
     */
    public DataSource getDataSource(String tenantId) throws SQLException {
        if (tenantId == null || tenantId.trim().isEmpty()) {
            throw new IllegalArgumentException("Tenant ID cannot be null or empty");
        }
        
        // Check cache first
        DataSource cached = dataSourceCache.get(tenantId);
        if (cached != null) {
            // Validate connection before returning
            if (validateDataSource(cached)) {
                lastAccessTime.put(tenantId, System.currentTimeMillis());
                return cached;
            } else {
                // Remove invalid DataSource from cache
                log.warn("Invalid DataSource found in cache for tenant {}. Removing and recreating.", tenantId);
                evictDataSource(tenantId);
            }
        }
        
        // Load configuration from metadata database
        TenantDbConfig config;
        try {
            config = tenantService.getTenantDbConfig(tenantId);
            if (config == null) {
                throw new TenantNotFoundException(tenantId);
            }
        } catch (TenantNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error loading tenant configuration for tenant {}: {}", tenantId, e.getMessage(), e);
            throw new TenantNotFoundException(tenantId, e);
        }
        
        // Create new DataSource
        DataSource dataSource;
        try {
            dataSource = createDataSource(config);
        } catch (Exception e) {
            log.error("Error creating DataSource for tenant {}: {}", tenantId, e.getMessage(), e);
            throw new TenantConnectionException(tenantId, "Failed to create DataSource", e);
        }
        
        // Validate connection before caching
        try {
            if (!validateDataSource(dataSource)) {
                throw new TenantConnectionException(tenantId, "Initial connection validation failed");
            }
        } catch (Exception e) {
            log.error("Initial connection validation failed for tenant {}: {}", tenantId, e.getMessage(), e);
            throw new TenantConnectionException(tenantId, "Connection validation failed", e);
        }
        
        // Wrap with retry logic
        RetryConfig retryConfig = new RetryConfig();
        retryConfig.setMaxAttempts(properties.getRetry().getMaxAttempts());
        retryConfig.setInitialDelay(properties.getRetry().getInitialDelay());
        retryConfig.setMaxDelay(properties.getRetry().getMaxDelay());
        DataSource retryableDataSource = new RetryableDataSource(dataSource, retryConfig);
        
        // Cache it
        dataSourceCache.put(tenantId, retryableDataSource);
        lastAccessTime.put(tenantId, System.currentTimeMillis());
        
        log.info("Created and cached DataSource for tenant: {}", tenantId);
        return retryableDataSource;
    }
    
    /**
     * Create HikariCP DataSource for tenant database
     */
    private DataSource createDataSource(TenantDbConfig config) {
        HikariConfig hikariConfig = new HikariConfig();
        
        // Get database type (default to postgres if not specified)
        String dbType = config.getDbType();
        if (dbType == null || dbType.trim().isEmpty()) {
            dbType = "postgres";
            log.warn("DB_TYPE not specified for tenant {}, defaulting to postgres", config.getTenantId());
        }
        dbType = dbType.toLowerCase().trim();
        
        // Build JDBC URL based on database type
        String jdbcUrl = buildJdbcUrl(dbType, config.getDbHost(), config.getDbPort(), config.getDbName());
        String driverClassName = getDriverClassName(dbType);
        
        hikariConfig.setJdbcUrl(jdbcUrl);
        hikariConfig.setUsername(config.getDbUsername());
        hikariConfig.setPassword(config.getDbPassword());
        hikariConfig.setDriverClassName(driverClassName);
        
        // Pool configuration from properties
        hikariConfig.setPoolName("TenantPool-" + config.getTenantId());
        hikariConfig.setMinimumIdle(properties.getPool().getMinimumIdle());
        hikariConfig.setMaximumPoolSize(properties.getPool().getMaximumPoolSize());
        hikariConfig.setConnectionTimeout(properties.getPool().getConnectionTimeout());
        hikariConfig.setIdleTimeout(properties.getPool().getIdleTimeout());
        hikariConfig.setMaxLifetime(properties.getPool().getMaxLifetime());
        hikariConfig.setAutoCommit(true);
        hikariConfig.setRegisterMbeans(true);
        
        // Connection validation query based on database type
        hikariConfig.setConnectionTestQuery(getConnectionTestQuery(dbType));
        
        return new HikariDataSource(hikariConfig);
    }
    
    /**
     * Build JDBC URL based on database type
     */
    private String buildJdbcUrl(String dbType, String host, Integer port, String dbName) {
        switch (dbType) {
            case "postgres":
            case "postgresql":
                return String.format("jdbc:postgresql://%s:%d/%s", host, port, dbName);
            case "mysql":
                return String.format("jdbc:mysql://%s:%d/%s", host, port, dbName);
            case "mssql":
                return String.format("jdbc:sqlserver://%s:%d;databaseName=%s", host, port, dbName);
            case "oracle":
                // Oracle uses SID or Service Name format
                // Format: jdbc:oracle:thin:@host:port:dbName (for SID)
                // or jdbc:oracle:thin:@//host:port/dbName (for Service Name)
                return String.format("jdbc:oracle:thin:@%s:%d:%s", host, port, dbName);
            default:
                throw new IllegalArgumentException("Unsupported database type: " + dbType + ". Supported types: postgres, mysql, oracle");
        }
    }
    
    /**
     * Get driver class name based on database type
     */
    private String getDriverClassName(String dbType) {
        switch (dbType) {
            case "postgres":
            case "postgresql":
                return "org.postgresql.Driver";
            case "mysql":
                return "com.mysql.cj.jdbc.Driver";
            case "mssql":
                return "com.microsoft.sqlserver.jdbc.SQLServerDriver";
            case "oracle":
                return "oracle.jdbc.OracleDriver";
            default:
                throw new IllegalArgumentException("Unsupported database type: " + dbType + ". Supported types: postgres, mysql, oracle");
        }
    }
    
    /**
     * Get connection test query based on database type
     */
    private String getConnectionTestQuery(String dbType) {
        switch (dbType) {
            case "postgres":
            case "postgresql":
                return "SELECT 1";
            case "mysql":
                return "SELECT 1";
            case "mssql":
                return "SELECT 1";
            case "oracle":
                return "SELECT 1 FROM DUAL";
            default:
                throw new IllegalArgumentException("Unsupported database type: " + dbType + ". Supported types: postgres, mysql, mssql, oracle");
        }
    }
    
    /**
     * Validate DataSource connection
     */
    private boolean validateDataSource(DataSource dataSource) {
        try (Connection conn = dataSource.getConnection()) {
            return conn.isValid(5); // 5 second timeout
        } catch (SQLException e) {
            log.warn("DataSource validation failed: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Validate connection for a specific tenant
     */
    public void validateConnection(String tenantId) throws SQLException {
        DataSource dataSource = getDataSource(tenantId);
        if (!validateDataSource(dataSource)) {
            throw new SQLException("Connection validation failed for tenant: " + tenantId);
        }
    }
    
    /**
     * Evict DataSource from cache and close it
     */
    public void evictDataSource(String tenantId) {
        DataSource dataSource = dataSourceCache.remove(tenantId);
        lastAccessTime.remove(tenantId);
        
        if (dataSource != null) {
            try {
                if (dataSource instanceof HikariDataSource) {
                    ((HikariDataSource) dataSource).close();
                } else if (dataSource instanceof RetryableDataSource) {
                    // Unwrap to get underlying HikariDataSource
                    DataSource unwrapped = ((RetryableDataSource) dataSource).unwrap(HikariDataSource.class);
                    if (unwrapped instanceof HikariDataSource) {
                        ((HikariDataSource) unwrapped).close();
                    }
                }
                log.info("Evicted and closed DataSource for tenant: {}", tenantId);
            } catch (Exception e) {
                log.error("Error closing DataSource for tenant {}: {}", tenantId, e.getMessage(), e);
            }
        }
    }
    
    /**
     * Start background thread for evicting inactive DataSources
     */
    private void startEvictionThread() {
        Thread evictionThread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()) {
                try {
                    Thread.sleep(60000); // Check every minute
                    evictInactiveDataSources();
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                } catch (Exception e) {
                    log.error("Error in eviction thread: {}", e.getMessage(), e);
                }
            }
        }, "TenantDataSourceEvictionThread");
        evictionThread.setDaemon(true);
        evictionThread.start();
    }
    
    /**
     * Evict DataSources that haven't been accessed within the eviction timeout
     */
    private void evictInactiveDataSources() {
        evictionLock.lock();
        try {
            long currentTime = System.currentTimeMillis();
            long evictionTimeout = properties.getCache().getEvictionTimeout();
            
            dataSourceCache.keySet().removeIf(tenantId -> {
                Long lastAccess = lastAccessTime.get(tenantId);
                if (lastAccess != null && (currentTime - lastAccess) > evictionTimeout) {
                    log.info("Evicting inactive DataSource for tenant: {} (inactive for {} ms)", 
                            tenantId, currentTime - lastAccess);
                    evictDataSource(tenantId);
                    return true;
                }
                return false;
            });
        } finally {
            evictionLock.unlock();
        }
    }
    
    /**
     * Shutdown all DataSources (called on application shutdown)
     */
    public void shutdownAll() {
        log.info("Shutting down all tenant DataSources...");
        evictionLock.lock();
        try {
            dataSourceCache.keySet().forEach(this::evictDataSource);
            dataSourceCache.clear();
            lastAccessTime.clear();
        } finally {
            evictionLock.unlock();
        }
        log.info("All tenant DataSources shut down");
    }
    
    /**
     * Get number of cached DataSources
     */
    public int getCacheSize() {
        return dataSourceCache.size();
    }
}
