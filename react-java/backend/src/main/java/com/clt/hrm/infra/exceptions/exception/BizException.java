package com.clt.hrm.infra.exceptions.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.springframework.http.HttpStatus;

@Data
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class BizException extends RuntimeException {
    private static final long serialVersionUID = 570024587430340625L;
    String errorCode;
    String errorMessage;
    String systemMessage;
    HttpStatus httpStatus;
}
