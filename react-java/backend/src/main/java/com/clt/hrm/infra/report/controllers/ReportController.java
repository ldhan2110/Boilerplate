package com.clt.hrm.infra.report.controllers;

import com.clt.hrm.infra.common.dtos.SuccessDto;
import com.clt.hrm.infra.report.dtos.ReportDto;
import com.clt.hrm.infra.report.dtos.ReportListDto;
import com.clt.hrm.infra.report.dtos.SearchReportDto;
import com.clt.hrm.infra.report.services.ExcelReportService;
import com.clt.hrm.infra.report.services.ReportService;
import com.clt.hrm.infra.utils.CommonFunction;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/com/reports")
@Tag(name = "Report Management", description = "Report template management endpoints")
@Slf4j
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private ExcelReportService excelReportService;

    @PostMapping("/list")
    @Operation(summary = "Get report list", description = "Get paginated list of reports")
    public ResponseEntity<ReportListDto> getReportList(@RequestBody SearchReportDto request) {
        try {
            // Set company ID from context if not provided
            if (request.getCoId() == null || request.getCoId().isEmpty()) {
                request.setCoId(CommonFunction.getCompanyId());
            }

            ReportListDto result = reportService.selectReportList(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("[ReportManagementController][getReportList] Error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{rptCd}")
    @Operation(summary = "Get report by code", description = "Get report details by report code")
    public ResponseEntity<ReportDto> getReport(@PathVariable String rptCd) {
        try {
            SearchReportDto search = new SearchReportDto();
            search.setCoId(CommonFunction.getCompanyId());
            search.setRptCd(rptCd);

            ReportDto report = reportService.getReport(search);
            if (report == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("[ReportManagementController][getReport] Error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping(value = "/insert", consumes = { "multipart/form-data" })
    @Operation(summary = "Insert report", description = "Create a new report with template file")
    public ResponseEntity<SuccessDto> insertReport(@RequestPart("report") String reportJson, @RequestPart("file") MultipartFile file) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            ReportDto report = objectMapper.readValue(reportJson, ReportDto.class);

            reportService.insertReport(report, file);
            return ResponseEntity.ok(SuccessDto.builder().success(true).build());
        } catch (Exception e) {
            log.error("[ReportController][insertReport] Error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SuccessDto.builder().success(false).build());
        }
    }

    @PostMapping(value = "/update", consumes = { "multipart/form-data" })
    @Operation(summary = "Update report", description = "Update an existing report with optional template file")
    public ResponseEntity<SuccessDto> updateReport(
            @RequestPart("report") String reportJson,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            ReportDto report = objectMapper.readValue(reportJson, ReportDto.class);

            reportService.updateReport(report, file);
            return ResponseEntity.ok(SuccessDto.builder().success(true).build());
        } catch (Exception e) {
            log.error("[ReportController][updateReport] Error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SuccessDto.builder().success(false).build());
        }
    }

    @PostMapping("/delete")
    @Operation(summary = "Delete report", description = "Delete report by report ID")
    public ResponseEntity<SuccessDto> deleteReport(@RequestBody String[] rptCdList) {
        try {
            String coId = CommonFunction.getCompanyId();
            reportService.deleteReport(coId, rptCdList);
            return ResponseEntity.ok(SuccessDto.builder().success(true).build());
        } catch (Exception e) {
            log.error("[ReportController][deleteReport] Error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SuccessDto.builder().success(false).build());
        }
    }

    @PostMapping("/downloadTestExcel")
    @Operation(summary = "Download test Excel", description = "Generate and download a sample Excel file with hardcoded data")
    public ResponseEntity<byte[]> downloadTestExcel() {
        try {
            byte[] excelBytes = excelReportService.generateSampleExcel();
            String fileName = "Sample_Employee_Report_" + LocalDate.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) + ".xlsx";
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(excelBytes);
        } catch (Exception e) {
            log.error("[ReportController][downloadTestExcel] Error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
