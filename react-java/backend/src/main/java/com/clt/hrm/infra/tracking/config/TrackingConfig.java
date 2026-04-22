package com.clt.hrm.infra.tracking.config;

import com.clt.hrm.infra.tracking.interceptor.TrackingInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * MVC configuration that registers TrackingInterceptor for API request paths.
 *
 * Only active when tracking.enabled=true (per D-08: deployment-time toggle).
 * When tracking.enabled=false, this bean is absent and no interceptor is registered.
 */
@Configuration
@ConditionalOnProperty(name = "tracking.enabled", havingValue = "true", matchIfMissing = false)
public class TrackingConfig implements WebMvcConfigurer {

	@Autowired
	private TrackingInterceptor trackingInterceptor;

	@Override
	public void addInterceptors(InterceptorRegistry registry) {
		registry.addInterceptor(trackingInterceptor)
				.addPathPatterns("/api/**")
				.excludePathPatterns(
						"/api/adm/auth/**",
						"/api/com/file/**",
						"/api/assistant/**");
	}
}
