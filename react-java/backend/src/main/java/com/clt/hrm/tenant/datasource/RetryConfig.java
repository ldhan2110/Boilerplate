package com.clt.hrm.tenant.datasource;

import lombok.Data;

@Data
public class RetryConfig {
    private int maxAttempts = 3;
    private long initialDelay = 1000; // milliseconds
    private long maxDelay = 10000; // milliseconds
    private double backoffMultiplier = 2.0;
    
    /**
     * Calculate delay for retry attempt using exponential backoff
     * @param attemptNumber Current attempt number (1-based)
     * @return Delay in milliseconds
     */
    public long calculateDelay(int attemptNumber) {
        if (attemptNumber <= 1) {
            return initialDelay;
        }
        
        long delay = (long) (initialDelay * Math.pow(backoffMultiplier, attemptNumber - 1));
        return Math.min(delay, maxDelay);
    }
}
