package com.clt.hrm.infra.batchjob.config;

import org.quartz.spi.JobFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.scheduling.quartz.SpringBeanJobFactory;

@Configuration
public class QuartzConfig {

	@Autowired
	private ApplicationContext applicationContext;

	@Bean
	SpringBeanJobFactory springBeanJobFactory() {
		AutowiringSpringBeanJobFactory jobFactory = new AutowiringSpringBeanJobFactory();
		jobFactory.setApplicationContext(applicationContext);
		return jobFactory;
	}

	@Bean
	SchedulerFactoryBean schedulerFactoryBean(JobFactory jobFactory) throws Exception {
		try {
			SchedulerFactoryBean factory = new SchedulerFactoryBean();
			factory.setConfigLocation(new ClassPathResource("/quartz.properties"));
			factory.setOverwriteExistingJobs(true);
			factory.setJobFactory(jobFactory);
			// Do NOT set DataSource here - Quartz will use its own data source from quartz.properties
			// Setting both causes connection pool conflicts and leaks
			factory.setWaitForJobsToCompleteOnShutdown(true);
			factory.setAutoStartup(false); // Don't auto-start - let SchedulerService control startup
			factory.afterPropertiesSet();
			return factory;
		} catch (Exception e) {
			// Log the exception
			e.printStackTrace();
			throw new RuntimeException("Error initializing Quartz Scheduler", e);
		}
	}
}
