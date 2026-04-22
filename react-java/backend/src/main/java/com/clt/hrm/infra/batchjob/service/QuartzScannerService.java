package com.clt.hrm.infra.batchjob.service;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;

import org.quartz.Job;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AssignableTypeFilter;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;

@Component
public class QuartzScannerService {
	private final Map<String, Class<? extends Job>> jobClassMap = new HashMap<>();

	@PostConstruct
	public void scan() {
		scanJobs("com.clt.hrm");
	}

	public void scanJobs(String basePackage) {
		ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);

		scanner.addIncludeFilter(new AssignableTypeFilter(Job.class));

		scanner.findCandidateComponents(basePackage).forEach(beanDef -> {
			try {
				Class<?> cls = Class.forName(beanDef.getBeanClassName());
				if (Job.class.isAssignableFrom(cls)) {
					Class<? extends Job> jobClass = (Class<? extends Job>) cls;

					// Store BOTH full name AND simple name
					jobClassMap.put(jobClass.getSimpleName(), jobClass);
					jobClassMap.put(jobClass.getName(), jobClass);
				}
			} catch (Exception ignored) {
			}
		});
	}

	public Class<? extends Job> findJobClass(String name) {
		return jobClassMap.get(name);
	}

	public Collection<Class<? extends Job>> getAllJobs() {
		return jobClassMap.values();
	}
}
