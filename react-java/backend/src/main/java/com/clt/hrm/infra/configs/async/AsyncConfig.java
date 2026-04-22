package com.clt.hrm.infra.configs.async;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import com.clt.hrm.tenant.TenantContextTaskDecorator;

@EnableAsync
@Configuration
public class AsyncConfig {
	@Bean(name = "logExecutor")
	Executor logExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(4);
		executor.setMaxPoolSize(8);
		executor.setQueueCapacity(5000);
		executor.setThreadNamePrefix("LogExec-");

		// Propagate tenant context to async threads
		executor.setTaskDecorator(new TenantContextTaskDecorator());

		// Wait for tasks to complete on shutdown
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(30);

		// Allow core threads to timeout
		executor.setAllowCoreThreadTimeOut(true);
		executor.setKeepAliveSeconds(60);

		executor.initialize();
		return executor;
	}

	@Bean(name = "exportTaskExecutor")
	Executor exportTaskExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(2);
		executor.setMaxPoolSize(5);
		executor.setQueueCapacity(100);
		executor.setThreadNamePrefix("export-");
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

		// Propagate tenant context to async threads
		executor.setTaskDecorator(new TenantContextTaskDecorator());

		// Wait for tasks to complete on shutdown
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(60);

		// Allow core threads to timeout
		executor.setAllowCoreThreadTimeOut(true);
		executor.setKeepAliveSeconds(60);
		executor.initialize();
		return executor;
	}

	@Bean(name = "processSalaryTaskExecutor")
	Executor processSalaryTaskExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(2);
		executor.setMaxPoolSize(2);
		executor.setQueueCapacity(100);
		executor.setThreadNamePrefix("processSalary-");
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		executor.setTaskDecorator(new TenantContextTaskDecorator());
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(120);
		executor.setAllowCoreThreadTimeOut(true);
		executor.setKeepAliveSeconds(60);
		executor.initialize();
		return executor;
	}

	@Bean(name = "codeQueryExecutor")
	Executor codeQueryExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(4);
		executor.setMaxPoolSize(10);
		executor.setQueueCapacity(200);
		executor.setThreadNamePrefix("codeQuery-");
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

		// Propagate tenant context to async threads
		executor.setTaskDecorator(new TenantContextTaskDecorator());

		// Wait for tasks to complete on shutdown
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(30);

		// Allow core threads to timeout
		executor.setAllowCoreThreadTimeOut(true);
		executor.setKeepAliveSeconds(60);
		executor.initialize();
		return executor;
	}

	/**
	 * Executor for best-effort async tracking writes.
	 * Uses DiscardPolicy: when the queue is full, new tracking tasks are silently dropped
	 * rather than blocking the calling thread. Tracking is best-effort - a dropped write
	 * is acceptable and must never impact HRM-X API response latency.
	 */
	@Bean(name = "trackingExecutor")
	Executor trackingExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(2);
		executor.setMaxPoolSize(4);
		executor.setQueueCapacity(10000);
		executor.setThreadNamePrefix("tracking-");

		// DiscardPolicy: drop tasks silently when queue is full (tracking is best-effort)
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());

		// Propagate tenant context to async tracking threads
		executor.setTaskDecorator(new TenantContextTaskDecorator());

		// Do not block shutdown waiting for tracking tasks - they are best-effort
		executor.setWaitForTasksToCompleteOnShutdown(false);
		executor.initialize();
		return executor;
	}

	/**
	 * Executor for the payslip enqueue step: Thymeleaf rendering + batch DB insert.
	 * Kept separate from {@code payslipEmailExecutor} so that a long-running SMTP
	 * dispatch cycle never blocks a new render/insert request.
	 */
	@Bean(name = "payslipEnqueueExecutor")
	Executor payslipEnqueueExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(1);
		executor.setMaxPoolSize(2);
		executor.setQueueCapacity(20);
		executor.setThreadNamePrefix("payslipEnqueue-");
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

		// Propagate tenant context to async threads
		executor.setTaskDecorator(new TenantContextTaskDecorator());

		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(120);
		executor.setAllowCoreThreadTimeOut(true);
		executor.setKeepAliveSeconds(60);

		executor.initialize();
		return executor;
	}

	/**
	 * Executor for SMTP dispatch cycles. Single-threaded by design: Google Workspace
	 * rate-limits per connection, so one thread with inter-email sleeps is the
	 * correct strategy. Do NOT submit non-SMTP work here.
	 */
	@Bean(name = "payslipEmailExecutor")
	Executor payslipEmailExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(1);
		executor.setMaxPoolSize(1);
		executor.setQueueCapacity(500);
		executor.setThreadNamePrefix("payslipEmail-");
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());

		// Propagate tenant context to async threads
		executor.setTaskDecorator(new TenantContextTaskDecorator());

		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(60);
		executor.setAllowCoreThreadTimeOut(true);
		executor.setKeepAliveSeconds(60);

		executor.initialize();
		return executor;
	}

	@Bean(name = "cvProcessingExecutor")
	Executor cvProcessingExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(2);
		executor.setMaxPoolSize(4);
		executor.setQueueCapacity(20);
		executor.setThreadNamePrefix("CvProc-");
		executor.setTaskDecorator(new TenantContextTaskDecorator());
		executor.setWaitForTasksToCompleteOnShutdown(true);
		executor.setAwaitTerminationSeconds(60);
		executor.setAllowCoreThreadTimeOut(true);
		executor.setKeepAliveSeconds(120);
		executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
		executor.initialize();
		return executor;
	}

	@Bean("documentProcessingExecutor")
	Executor documentProcessingExecutor() {
		ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
		executor.setCorePoolSize(2);
		executor.setMaxPoolSize(4);
		executor.setQueueCapacity(50);
		executor.setThreadNamePrefix("doc-process-");

		// Propagate tenant context to async threads
		executor.setTaskDecorator(new TenantContextTaskDecorator());

		executor.initialize();
		return executor;
	}
}
