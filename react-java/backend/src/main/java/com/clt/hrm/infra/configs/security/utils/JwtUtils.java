package com.clt.hrm.infra.configs.security.utils;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.infra.exceptions.exception.BizException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class JwtUtils {
	@Value("${jwt.access-token-secret}")
	private String secretKey;

	@Value("${jwt.refresh-token-secret}")
	private String refreshSecretKey;

	@Value("${jwt.expireTime}")
	private Integer expireTime;

	private final long refreshExpireTime = 7 * 24 * 60 * 60 * 1000L;
	

	public int getAccessExpireTime() {
		return expireTime;
	}

	public long getRefreshExpireTime() {
		return refreshExpireTime;
	}

	public String generateToken(String username, UserInfo userInfo) {
		SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
		return Jwts.builder().setSubject(username).claim("userInfo", userInfo).setIssuedAt(new Date())
				.setExpiration(new Date(System.currentTimeMillis() + expireTime.intValue())).signWith(key).compact();
	}

	public String generateRefreshToken(String username) {
		SecretKey key = Keys.hmacShaKeyFor(refreshSecretKey.getBytes(StandardCharsets.UTF_8));
		return Jwts.builder().setSubject(username).setIssuedAt(new Date())
				.setExpiration(new Date(System.currentTimeMillis() + refreshExpireTime)).signWith(key).compact();
	}

	public Claims extractClaims(String token) {
		SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
		return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
	}

	public Claims extractClaimsForRefreshToken(String token) {
		SecretKey key = Keys.hmacShaKeyFor(refreshSecretKey.getBytes(StandardCharsets.UTF_8));
		return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody();
	}

	public String extractUsername(String token) {
		return extractClaims(token).getSubject();
	}

	public String extractUsernameForRefreshToken(String token) {
		return extractClaimsForRefreshToken(token).getSubject();
	}

	public boolean isTokenExpiredForRefreshToken(String token) {
		return extractClaimsForRefreshToken(token).getExpiration().before(new Date());
	}

	public boolean isTokenExpired(String token) {
		return extractClaims(token).getExpiration().before(new Date());
	}

	public boolean validateRefreshToken(String token) {
		try {
			String extracted = extractUsernameForRefreshToken(token);
			boolean expired = isTokenExpiredForRefreshToken(token);
			return extracted != null && !expired;
		} catch (Exception e) {
			log.error(e.getMessage());
			throw new BizException("SYSMESSAGE","Refresh token expired","Refresh token expired", HttpStatus.FORBIDDEN);
		}
	}

	public boolean validateToken(String token, String username) {
		try {
			String extracted = extractUsername(token);
			boolean expired = isTokenExpired(token);
			return extracted.equals(username) && !expired;
		} catch (Exception e) {
			log.error(e.getMessage());
			return false;
		}
	}

	public Date extractExpiration(String token) {
	    return extractClaims(token).getExpiration();
	}
	
	public String getTokenFromRequest(HttpServletRequest request) {
		String bearerToken = request.getHeader("Authorization");
		if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
			return bearerToken.substring(7);
		}
		return null;
	}
}