package com.clt.hrm.infra.export.events;

import java.time.Instant;

import com.clt.hrm.infra.export.interfaces.IExcelExportService;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExportRequestedEvent<T, F> {
	private String coId;
	private String jobId;
	private F filter;
	private String fileNm;
	private String rqstUsrId;
	private Instant expiresAt;
	private IExcelExportService<T, F> exportService;

	public boolean isExpired() {
		return Instant.now().isAfter(expiresAt);
	}
}
