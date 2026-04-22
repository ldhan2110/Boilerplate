package com.clt.hrm.infra.batchjob.dtos;

import java.util.Date;
import java.util.Map;

import com.clt.hrm.infra.common.dtos.BaseDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@EqualsAndHashCode(callSuper = false)
public class BatchJobConfigDto extends BaseDto {
	private static final long serialVersionUID = -3986543814014339227L;
	private String batJbId;
	private String batJbNm;
	private String batJbClss;
	private String batJbStsCd;
	private String batJbDesc;
	private String cronXprVal;
	private String cronDesc;
	private Map<String, Object> jobParams;
	private Date batJbLstRunDt;
	private Date batJbNxtRunDt;
}
