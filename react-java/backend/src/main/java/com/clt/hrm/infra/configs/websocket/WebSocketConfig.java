package com.clt.hrm.infra.configs.websocket;

import com.clt.hrm.core.authentication.service.AuthService;
import com.clt.hrm.infra.configs.security.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
@EnableWebSocketMessageBroker
@ConditionalOnProperty(name = "websocket.enabled", havingValue = "true", matchIfMissing = false)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	@Autowired
	private JwtUtils jwtUtils;

	@Autowired
	AuthService authService;

	@Bean
	WebSocketEventListener initWebSocketEventListener() {
		return new WebSocketEventListener();
	}

	@Bean
	MessageBroadcaster initMessageBroadcaster(SimpMessagingTemplate template) {
		return new MessageBroadcaster(template);
	}

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/ws")
				.setAllowedOriginPatterns("*")
				.withSockJS();

	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.setApplicationDestinationPrefixes("/app");
		registry.enableSimpleBroker("/topic", "/queue");
		registry.setUserDestinationPrefix("/user");
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(new ChannelInterceptor() {
			@Override
			public Message<?> preSend(Message<?> message, MessageChannel channel) {
				StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

				if (StompCommand.CONNECT.equals(accessor.getCommand())) {
					String authorizationHeader = accessor.getFirstNativeHeader("Authorization");
					if (authorizationHeader != null) {
						String token = authorizationHeader.substring(7);

						try {
							String username = jwtUtils.extractUsername(token);

							if (username != null && jwtUtils.validateToken(token, username)) {
								UserDetails userDetails = authService.loadUserByUsername(username);
								UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
										userDetails, null, userDetails.getAuthorities());

								SecurityContextHolder.getContext().setAuthentication(authToken);
								accessor.setUser(authToken);

								log.info("[WebSocketConfig][configureClientInboundChannel] WebSocket connection authenticated for user: {}", username);
							} else {
								log.warn("[WebSocketConfig][configureClientInboundChannel] Invalid JWT token for WebSocket connection");
								throw new RuntimeException("Invalid token");
							}
						} catch (Exception e) {
							log.error("[WebSocketConfig][configureClientInboundChannel] JWT authentication failed for WebSocket: {}", e.getMessage());
							throw new RuntimeException("[WebSocketConfig][configureClientInboundChannel] Authentication failed");
						}
					} else {
						log.warn("[WebSocketConfig][configureClientInboundChannel] No Authorization header found for WebSocket connection");
						throw new RuntimeException("[WebSocketConfig][configureClientInboundChannel] Missing Authorization header");
					}
				}
				return message;
			}
		});
	}

}
