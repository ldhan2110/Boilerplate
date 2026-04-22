package com.clt.hrm.infra.export.interfaces;

import org.apache.poi.ss.usermodel.Workbook;

import com.clt.hrm.infra.export.dtos.ExportJobDto;

public interface IExcelExportService<T, F> {
	/**
	 * Implement this method to define Excel structure and data mapping
	 */
	void writeExcelData(Workbook workbook, F filter, ExportJobDto job);

	/**
	 * Implement this method to count number of rows needed to write
	 */
	int countExportData(F filter);

	/**
	 * Optional: Override to provide custom filename
	 */
	default String getFileName() {
		return "export_" + System.currentTimeMillis() + ".xlsx";
	}
}
