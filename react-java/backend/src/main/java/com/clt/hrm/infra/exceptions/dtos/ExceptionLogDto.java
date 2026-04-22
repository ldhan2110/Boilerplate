package com.clt.hrm.infra.exceptions.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ExceptionLogDto extends BaseDto {
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private String msgId;
	private String errMsg;
	private String endpoint;
	private JsonNode rqstPara;
	private String mdlNm;
	private String stackTrace;
}
