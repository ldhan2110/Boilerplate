package com.clt.hrm.infra.configs.security.config;

import com.clt.hrm.core.authentication.service.AuthService;
import com.clt.hrm.infra.configs.security.filters.JwtAuthenticationFilter;
import com.clt.hrm.infra.configs.security.filters.PublicApiAuthFilter;

import java.util.List;

import org.springframework.boot.web.servlet.FilterRegistrationBean;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.clt.hrm.infra.configs.security.utils.JwtAuthConverter;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {
	@Autowired
	JwtAuthConverter jwtAuthConverter;

	@Autowired
	AuthService authService;

	@Autowired
	JwtAuthenticationFilter jwtAuthenticationFilter;

	@Autowired
	PublicApiAuthFilter publicApiAuthFilter;

    @Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	DaoAuthenticationProvider authenticationProvider() {
		DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(authService);
		authProvider.setPasswordEncoder(passwordEncoder());
		return authProvider;
	}

	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
		return authConfig.getAuthenticationManager();
	}

	@Bean
	@ConditionalOnProperty(value = "keycloak.enabled", havingValue = "false", matchIfMissing = true)
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http.cors(Customizer.withDefaults())
				.csrf(csrf -> csrf.disable())
				.authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.POST, "/api/adm/auth/login").permitAll()
//						.requestMatchers(HttpMethod.POST, "/api/adm/user/createUser").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/adm/auth/refresh-token").permitAll()
						.requestMatchers("/publicApi/**", "/actuator/prometheus", "/swagger-ui/**", "/api-docs/**", "/ws/**", "/api/com/file/**", "/api/assistant/**").permitAll()
                        .anyRequest()
						.authenticated())
				.authenticationProvider(authenticationProvider())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(publicApiAuthFilter, JwtAuthenticationFilter.class);
		return http.build();
	}

	@Bean
	@ConditionalOnProperty(value = "keycloak.enabled", havingValue = "true")
	SecurityFilterChain keycloakFilterChain(HttpSecurity http) throws Exception {
		http.csrf(csrf -> csrf.disable())
				.authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.POST, "/api/adm/auth/login").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/adm/auth/refresh").permitAll()
						.requestMatchers("/actuator/prometheus").permitAll()
						.requestMatchers("/publicApi/**", "/swagger-ui/**", "/api-docs/**", "/reports/**").permitAll()
						.anyRequest()
						.authenticated())
				.oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthConverter)))
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
		http.addFilterBefore(publicApiAuthFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	@Bean
	FilterRegistrationBean<PublicApiAuthFilter> publicApiAuthFilterRegistration(PublicApiAuthFilter filter) {
		FilterRegistrationBean<PublicApiAuthFilter> registration = new FilterRegistrationBean<>(filter);
		registration.setEnabled(false);
		return registration;
	}

	@Bean
	CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOriginPatterns(List.of(
			"http://localhost:*",
			"http://127.0.0.1:*",
			"http://10.0.0.*:*",
			"http://frontend:*",
			"http://*.localhost:*",
			"https://sambu.cyberlogitec.com.vn",
			"https://sambu.cyberlogitec.com.vn:*",
			"http://sambu.cyberlogitec.com.vn:*"
		));
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
		config.setAllowedHeaders(List.of("*"));
		config.setExposedHeaders(List.of("Content-Disposition"));
		config.setAllowCredentials(true);
		config.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}

	@Bean
	WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/**")
						// Use allowedOriginPatterns to support patterns with credentials
						// Patterns: * matches any character, ? matches single character
						.allowedOriginPatterns(
								"http://localhost:*",
								"http://127.0.0.1:*",
								"http://10.0.0.*:*",
								"http://frontend:*",
								"http://*.localhost:*",
								"http://*.127.0.0.1:*",
								"http://sambu.cyberlogitec.com.vn:*"
						)
						.allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
						.exposedHeaders("Content-Disposition")
						.allowedHeaders("*")
						.allowCredentials(true)
						.maxAge(3600);
			}
		};
	}
}
