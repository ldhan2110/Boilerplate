package com.clt.hrm.infra.common.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ErrorResponseDto {
	String errorCode;
	String errorMessage;
	String systemMessage;
}
