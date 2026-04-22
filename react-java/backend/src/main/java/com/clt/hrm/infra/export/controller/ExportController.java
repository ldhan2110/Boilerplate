package com.clt.hrm.infra.export.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.infra.export.dtos.ExportJobListDto;
import com.clt.hrm.infra.export.dtos.SearchExportJobDto;
import com.clt.hrm.infra.export.service.ExportExcelService;
import com.clt.hrm.infra.utils.CommonFunction;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/sys/exportJob")
public class ExportController {
	@Autowired
	private ExportExcelService service;

	@PostMapping("/getExportJobList")
	public ResponseEntity<ExportJobListDto> getExportJobList(@Valid @RequestBody SearchExportJobDto request) {
		return ResponseEntity.ok(service.getExportJobList(request));
	}

	/**
	 * Confirm export job - user accepts to proceed
	 */
	@GetMapping("/confirm/{jobId}")
	public ResponseEntity<?> confirmExport(@PathVariable("jobId") String jobId) {
		String coId = CommonFunction.getCompanyId();
		service.confirmExport(coId, jobId);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}

	/**
	 * Cancel export job - user declines
	 */
	@GetMapping("/cancel/{jobId}")
	public ResponseEntity<SuccessDto> cancelExport(@PathVariable("jobId") String jobId) {
		String coId = CommonFunction.getCompanyId();
		service.cancelExport(coId, jobId);
		return ResponseEntity.ok(SuccessDto.builder().success(true).build());
	}
}
