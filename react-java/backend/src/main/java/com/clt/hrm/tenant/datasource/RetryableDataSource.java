package com.clt.hrm.tenant.datasource;

import lombok.extern.slf4j.Slf4j;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.logging.Logger;

/**
 * Wrapper DataSource that adds retry logic with exponential backoff
 * for handling transient connection failures
 */
@Slf4j
public class RetryableDataSource implements DataSource {
    
    private final DataSource delegate;
    private final RetryConfig retryConfig;
    
    public RetryableDataSource(DataSource delegate, RetryConfig retryConfig) {
        this.delegate = delegate;
        this.retryConfig = retryConfig;
    }
    
    @Override
    public Connection getConnection() throws SQLException {
        return getConnectionWithRetry();
    }
    
    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        return getConnectionWithRetry(username, password);
    }
    
    private Connection getConnectionWithRetry() throws SQLException {
        SQLException lastException = null;
        
        for (int attempt = 1; attempt <= retryConfig.getMaxAttempts(); attempt++) {
            try {
                return delegate.getConnection();
            } catch (SQLException e) {
                lastException = e;
                
                // Check if error is retryable
                if (!isRetryable(e) || attempt >= retryConfig.getMaxAttempts()) {
                    throw e;
                }
                
                // Calculate delay and wait
                long delay = retryConfig.calculateDelay(attempt);
                log.warn("Connection attempt {} failed for tenant database. Retrying in {} ms. Error: {}", 
                        attempt, delay, e.getMessage());
                
                try {
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new SQLException("Retry interrupted", ie);
                }
            }
        }
        
        throw lastException != null ? lastException : new SQLException("Failed to get connection after retries");
    }
    
    private Connection getConnectionWithRetry(String username, String password) throws SQLException {
        SQLException lastException = null;
        
        for (int attempt = 1; attempt <= retryConfig.getMaxAttempts(); attempt++) {
            try {
                return delegate.getConnection(username, password);
            } catch (SQLException e) {
                lastException = e;
                
                if (!isRetryable(e) || attempt >= retryConfig.getMaxAttempts()) {
                    throw e;
                }
                
                long delay = retryConfig.calculateDelay(attempt);
                log.warn("Connection attempt {} failed for tenant database. Retrying in {} ms. Error: {}", 
                        attempt, delay, e.getMessage());
                
                try {
                    Thread.sleep(delay);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new SQLException("Retry interrupted", ie);
                }
            }
        }
        
        throw lastException != null ? lastException : new SQLException("Failed to get connection after retries");
    }
    
    /**
     * Determine if SQLException is retryable
     * Retryable errors: connection timeouts, network errors, temporary failures
     */
    private boolean isRetryable(SQLException e) {
        String sqlState = e.getSQLState();
        
        // PostgreSQL error codes that are retryable
        // 08000 - connection exception
        // 08003 - connection does not exist
        // 08006 - connection failure
        // 08001 - SQL client unable to establish SQL connection
        // 08004 - SQL server rejected establishment of SQL connection
        // 57P01 - admin shutdown
        // 57P02 - crash shutdown
        // 57P03 - cannot connect now
        
        if (sqlState != null) {
            return sqlState.startsWith("08") || // Connection exceptions
                   sqlState.equals("57P01") || // Admin shutdown
                   sqlState.equals("57P02") || // Crash shutdown
                   sqlState.equals("57P03");  // Cannot connect now
        }
        
        // Check error message for common retryable patterns
        String message = e.getMessage();
        if (message != null) {
            String lowerMessage = message.toLowerCase();
            return lowerMessage.contains("connection") ||
                   lowerMessage.contains("timeout") ||
                   lowerMessage.contains("network") ||
                   lowerMessage.contains("temporary");
        }
        
        return false;
    }
    
    // Delegate all other methods to underlying DataSource
    
    @Override
    public PrintWriter getLogWriter() throws SQLException {
        return delegate.getLogWriter();
    }
    
    @Override
    public void setLogWriter(PrintWriter out) throws SQLException {
        delegate.setLogWriter(out);
    }
    
    @Override
    public void setLoginTimeout(int seconds) throws SQLException {
        delegate.setLoginTimeout(seconds);
    }
    
    @Override
    public int getLoginTimeout() throws SQLException {
        return delegate.getLoginTimeout();
    }
    
    @Override
    public Logger getParentLogger() throws SQLFeatureNotSupportedException {
        return delegate.getParentLogger();
    }
    
    @Override
    public <T> T unwrap(Class<T> iface) throws SQLException {
        if (iface.isInstance(this)) {
            return iface.cast(this);
        }
        return delegate.unwrap(iface);
    }
    
    @Override
    public boolean isWrapperFor(Class<?> iface) throws SQLException {
        return iface.isInstance(this) || delegate.isWrapperFor(iface);
    }
}
