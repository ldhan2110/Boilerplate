package com.clt.hrm;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
@MapperScan(basePackages = {
		"com.clt.hrm.**.mapper",
		"com.clt.hrm.**.mappers"
}, sqlSessionFactoryRef = "sqlSessionFactory", excludeFilters = @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.clt\\.hrm\\.tenant\\.mapper\\..*"))
public class Application {
	public static void main(String[] args) {
		SpringApplication.run(Application.class, args);
	}
}
