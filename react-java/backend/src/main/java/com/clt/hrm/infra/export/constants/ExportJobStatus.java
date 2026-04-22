package com.clt.hrm.infra.export.constants;

public enum ExportJobStatus {
	PENDING_CONFIRMATION("PENDING_CONFIRMATION"), // Waiting for user confirmation
	QUEUED("QUEUED"), // Confirmed, waiting in queue
	PROCESSING("PROCESSING"), // Currently being processed
	COMPLETED("COMPLETED"), // Successfully completed
	FAILED("FAILED"), // Failed with error
	CANCELLED("CANCELLED"); // User cancelled

	private final String value;

	ExportJobStatus(String value) {
		this.value = value;
	}

	public String getValue() {
		return value;
	}
}
