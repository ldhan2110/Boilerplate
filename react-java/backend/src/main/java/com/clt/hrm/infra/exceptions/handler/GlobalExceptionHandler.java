package com.clt.hrm.infra.exceptions.handler;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.security.core.AuthenticationException;

import com.clt.hrm.infra.common.dtos.ErrorResponseDto;
import com.clt.hrm.infra.exceptions.dtos.ExceptionLogDto;
import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.exceptions.service.ExceptionLogService;
import com.clt.hrm.tenant.TenantContext;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

	@Autowired
	private ExceptionLogService errlogService;

	@ExceptionHandler(AuthenticationException.class)
	@ResponseStatus(value = HttpStatus.FORBIDDEN)
	public ErrorResponseDto AuthenticationException(Exception ex, WebRequest request) {
		log.error("[ERROR]" + "[" + request.getClass().getName() + "]:" + ex.getMessage());

		// Persistent logs DB - only if tenant is set
		if (TenantContext.hasTenant()) {
			ExceptionLogDto dto = errlogService.buildErrorLog(ex, request);
			errlogService.logException(dto);
		}

		return new ErrorResponseDto("UNAUTHORIZED", ex.getMessage(), ex.getMessage());
	}

	@ExceptionHandler(Exception.class)
	@ResponseStatus(value = HttpStatus.INTERNAL_SERVER_ERROR)
	public ErrorResponseDto GlobalException(Exception ex, WebRequest request) {
		log.error("[ERROR]" + "[" + request.getClass().getName() + "]:" + ex.getMessage());

		// Persistent logs DB - only if tenant is set
		if (TenantContext.hasTenant()) {
			ExceptionLogDto dto = errlogService.buildErrorLog(ex, request);
			errlogService.logException(dto);
		}

		return new ErrorResponseDto("SYSMESSAGE", "Something went wrong.", ex.getMessage());
	}

	@ExceptionHandler(BizException.class)
	public ResponseEntity<ErrorResponseDto> BusinessException(BizException ex, WebRequest request) {
		log.error("[ERROR][" + request.getClass().getName() + "]:" + ex.getErrorMessage());
		ErrorResponseDto errorResponse = new ErrorResponseDto(ex.getErrorCode(), ex.getErrorMessage(),
				ex.getSystemMessage());

		// Persistent logs DB - only if tenant is set
		if (TenantContext.hasTenant()) {
			ExceptionLogDto dto = errlogService.buildErrorLog(ex, request);
			errlogService.logException(dto);
		}

		return new ResponseEntity<>(errorResponse, ex.getHttpStatus());
	}

}
