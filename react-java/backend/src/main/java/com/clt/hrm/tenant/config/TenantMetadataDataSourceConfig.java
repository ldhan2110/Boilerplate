package com.clt.hrm.tenant.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.PropertySource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

import javax.sql.DataSource;

@Configuration
@PropertySource("classpath:tenant-metadata-db.properties")
@MapperScan(
    basePackages = "com.clt.hrm.tenant.mapper",
    sqlSessionFactoryRef = "metadataSqlSessionFactory"
)
public class TenantMetadataDataSourceConfig {

    @Value("${tenant.metadata.db.driver-class-name}")
    private String driverClassName;

    @Value("${tenant.metadata.db.url}")
    private String url;

    @Value("${tenant.metadata.db.username}")
    private String username;

    @Value("${tenant.metadata.db.password}")
    private String password;

    @Value("${tenant.metadata.db.hikari.pool-name:MetadataDBPool}")
    private String poolName;

    @Value("${tenant.metadata.db.hikari.minimum-idle:2}")
    private int minimumIdle;

    @Value("${tenant.metadata.db.hikari.maximum-pool-size:10}")
    private int maximumPoolSize;

    @Value("${tenant.metadata.db.hikari.connection-timeout:30000}")
    private long connectionTimeout;

    @Value("${tenant.metadata.db.hikari.idle-timeout:600000}")
    private long idleTimeout;

    @Value("${tenant.metadata.db.hikari.max-lifetime:1800000}")
    private long maxLifetime;

    /**
     * Create DataSource for metadata database (stores tenant connection info)
     * Note: Not marked as @Primary to avoid conflicts with main application DataSource
     */
    @Bean(name = "metadataDataSource")
    public DataSource metadataDataSource() {
        HikariConfig config = new HikariConfig();
        config.setDriverClassName(driverClassName);
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setPoolName(poolName);
        config.setMinimumIdle(minimumIdle);
        config.setMaximumPoolSize(maximumPoolSize);
        config.setConnectionTimeout(connectionTimeout);
        config.setIdleTimeout(idleTimeout);
        config.setMaxLifetime(maxLifetime);
        config.setAutoCommit(true);
        config.setRegisterMbeans(false);
        
        return new HikariDataSource(config);
    }

    /**
     * Create SqlSessionFactory for metadata database operations
     * This is used specifically for TenantDbConfigMapper
     */
    @Bean(name = "metadataSqlSessionFactory")
    public SqlSessionFactory metadataSqlSessionFactory(@Qualifier("metadataDataSource") DataSource dataSource) throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);
        
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        
        // Set MyBatis config location if it exists
        try {
            var configResource = resolver.getResource("classpath:mybatis-config.xml");
            if (configResource.exists()) {
                sessionFactory.setConfigLocation(configResource);
            }
        } catch (Exception e) {
            // Config file is optional, continue without it
        }
        
        // Only scan tenant mapper for metadata operations
        sessionFactory.setMapperLocations(
            resolver.getResources("classpath*:/mappers/tenant/**/*Mapper.xml")
        );
        
        return sessionFactory.getObject();
    }
    
    /**
     * Create SqlSessionTemplate for metadata database operations
     */
    @Bean(name = "metadataSqlSessionTemplate")
    public SqlSessionTemplate metadataSqlSessionTemplate(@Qualifier("metadataSqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }

    /**
     * Transaction manager for metadata database
     */
    @Bean(name = "metadataTransactionManager")
    public DataSourceTransactionManager metadataTransactionManager(@Qualifier("metadataDataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
