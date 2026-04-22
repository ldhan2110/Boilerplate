package com.clt.hrm.infra.configs.security.utils;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.stream.Collectors;

import com.clt.hrm.core.authentication.entities.UserInfo;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JwtAuthConverter implements Converter<Jwt, AbstractAuthenticationToken> {
	private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
		Map<String, Object> realmAccess = (Map<String, Object>) jwt.getClaims().get("realm_access");
		if (realmAccess == null || realmAccess.get("roles") == null) {
			return Collections.emptyList();
		}
		Collection<String> roles = (Collection<String>) realmAccess.get("roles");
		return roles.stream().map(role -> new SimpleGrantedAuthority("ROLE_" + role)).collect(Collectors.toList());
	}

	@Override
	public AbstractAuthenticationToken convert(Jwt jwt) {
		try {
			Collection<GrantedAuthority> authorities = extractAuthorities(jwt);
			String jsonString = jwt.getClaimAsString("example");
			ObjectMapper objectMapper = new ObjectMapper();
			UserInfo userInfo = objectMapper.readValue(jsonString, UserInfo.class);
			return new JwtAuthenticationToken(jwt, authorities) {
				@Override
				public Object getPrincipal() {
					return userInfo;
				}
			};
		} catch (Exception ex) {
			log.error("ERROR: ", ex.getMessage());
		}
		return null;
	}

}
