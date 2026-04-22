package com.clt.hrm.infra.export.events;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SerializableExportEvent {
	private String coId;
	private String jobId;
	private Object filter;
	private String fileNm;
	private String rqstUsrId;
	private Instant expiresAt;
}
