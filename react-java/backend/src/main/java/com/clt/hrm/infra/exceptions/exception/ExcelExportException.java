package com.clt.hrm.infra.exceptions.exception;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExcelExportException extends RuntimeException {
	/**
	 * 
	 */
	private static final long serialVersionUID = -1999166915281682165L;

	public ExcelExportException(String message) {
		super(message);
	}

	public ExcelExportException(String message, Throwable cause) {
		super(message, cause);
	}
}
