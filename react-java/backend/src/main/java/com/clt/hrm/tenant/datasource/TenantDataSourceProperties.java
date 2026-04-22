package com.clt.hrm.tenant.datasource;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "tenant.datasource")
public class TenantDataSourceProperties {
    private boolean enabled = true;
    private String defaultHost = "localhost";
    private Integer defaultPort = 5432;
    
    private Pool pool = new Pool();
    private Retry retry = new Retry();
    private Cache cache = new Cache();
    
    @Data
    public static class Pool {
        private int minimumIdle = 5;
        private int maximumPoolSize = 20;
        private long connectionTimeout = 30000;
        private long idleTimeout = 600000;
        private long maxLifetime = 1800000;
    }
    
    @Data
    public static class Retry {
        private int maxAttempts = 3;
        private long initialDelay = 1000;
        private long maxDelay = 10000;
    }
    
    @Data
    public static class Cache {
        private long evictionTimeout = 3600000; // 1 hour in milliseconds
    }
}
