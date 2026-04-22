package com.clt.hrm.core.authentication.dtos;

import lombok.Data;

@Data
public class RefreshTokenResponseDto {
	String accessToken;
	int accessExpireIn;
	String refreshToken;
	long refreshExpireIn;
}
