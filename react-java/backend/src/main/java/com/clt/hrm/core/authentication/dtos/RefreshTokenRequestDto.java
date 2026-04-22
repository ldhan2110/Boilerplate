package com.clt.hrm.core.authentication.dtos;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class RefreshTokenRequestDto {
	String refreshToken;
}
