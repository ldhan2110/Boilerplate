package com.clt.hrm.infra.configs.mybatis;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Primary;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;

import javax.sql.DataSource;

/**
 * MyBatis configuration for main application mappers.
 * Creates the primary SqlSessionFactory that uses TenantRoutingDataSource.
 */
@Configuration
public class MyBatisConfig {

    /**
     * Create primary SqlSessionFactory for main application mappers.
     * This uses the primary DataSource (TenantRoutingDataSource) for tenant routing.
     */
    @Bean(name = "sqlSessionFactory")
    @Primary
    @DependsOn("dataSource")
    public SqlSessionFactory sqlSessionFactory(@Qualifier("dataSource") DataSource dataSource) throws Exception {
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
        
        // Scan all mappers except tenant mappers (which use metadataSqlSessionFactory)
        // Load all mapper XMLs - MyBatis will handle multiple SqlSessionFactory instances correctly
        sessionFactory.setMapperLocations(
            resolver.getResources("classpath*:/mappers/**/*Mapper.xml")
        );
        
        return sessionFactory.getObject();
    }
    
    /**
     * Create SqlSessionTemplate for main application mappers.
     */
    @Bean(name = "sqlSessionTemplate")
    @Primary
    public SqlSessionTemplate sqlSessionTemplate(@Qualifier("sqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }

    /**
     * Transaction manager for main application.
     */
    @Bean(name = "transactionManager")
    @Primary
    public DataSourceTransactionManager transactionManager(@Qualifier("dataSource") DataSource dataSource) {
        return new DataSourceTransactionManager(dataSource);
    }
}
