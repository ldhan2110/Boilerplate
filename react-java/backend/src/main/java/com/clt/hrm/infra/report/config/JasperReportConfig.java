package com.clt.hrm.infra.report.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.ResourceLoader;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class JasperReportConfig {
	@Value("${jasper.reports.path:classpath:reports/}")
	private String reportsPath;

	@Bean
	ResourceLoader resourceLoader() {
		return new DefaultResourceLoader();
	}
}
