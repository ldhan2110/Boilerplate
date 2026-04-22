package com.clt.hrm.infra.export.dtos;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.fasterxml.jackson.databind.JsonNode;	

import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class ExportJobDto extends BaseDto {
	/**
	 * 
	 */
	private static final long serialVersionUID = -6133394423140180021L;
	private String jbId;
	private String jbSts;
	private int jbProg;
	private JsonNode jbRqstPara;
	private String errMsg;
	private String fileNm;
	private String fileId;
	private long totalRows;
}
