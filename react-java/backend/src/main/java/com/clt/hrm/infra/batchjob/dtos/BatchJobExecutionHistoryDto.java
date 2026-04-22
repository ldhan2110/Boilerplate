package com.clt.hrm.infra.batchjob.dtos;

import java.util.Date;

import com.clt.hrm.infra.common.dtos.BaseDto;
import com.fasterxml.jackson.databind.JsonNode;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class BatchJobExecutionHistoryDto extends BaseDto {
	/**
	 * 
	 */
	private static final long serialVersionUID = -6233301994365590577L;
	private String batExecId;
	private String batJbId;
	private String batJbStsCd;
	private Date batJbStDt;
	private Date batJbEndDt;
	private JsonNode batJbPara;
	private String batJbMsg;
	private Date batJbNxtRunDt;
}
