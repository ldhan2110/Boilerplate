package com.clt.hrm.infra.configs.async;

import java.io.IOException;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class RequestWrapperConfig {
	@Bean
	FilterRegistrationBean<OncePerRequestFilter> requestWrapperFilter() {
		FilterRegistrationBean<OncePerRequestFilter> registration = new FilterRegistrationBean<>();
		registration.setFilter(new OncePerRequestFilter() {
			@Override
			protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
				// Wrap request + response before passing forward
				ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
				ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);
				try {
					filterChain.doFilter(wrappedRequest, wrappedResponse);
				} finally {
					wrappedResponse.copyBodyToResponse(); // important!
				}
			}
		});

		registration.setOrder(0); // first filter
		return registration;
	}
}
