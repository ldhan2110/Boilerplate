package com.clt.hrm.infra.report.services;

import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.infra.exceptions.exception.BizException;
import com.clt.hrm.infra.file.constants.FilePathConstants;
import com.clt.hrm.infra.file.dtos.FileDto;
import com.clt.hrm.infra.file.dtos.SearchFileDto;
import com.clt.hrm.infra.file.service.FileService;
import com.clt.hrm.infra.report.dtos.ReportDto;
import com.clt.hrm.infra.report.dtos.ReportListDto;
import com.clt.hrm.infra.report.dtos.SearchReportDto;
import com.clt.hrm.infra.report.interfaces.IDocxCustomizer;
import com.clt.hrm.infra.report.mappers.ReportMapper;
import com.clt.hrm.infra.utils.CommonFunction;
import lombok.extern.slf4j.Slf4j;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
public class ReportService {

    @Autowired
    private ReportMapper reportMapper;

    @Autowired
    private FileService fileService;

    @Autowired
    private DocumentService documentService;

    // @Autowired
    // private ReportDispatcherService reportDispatcher;

    public ReportListDto selectReportList(SearchReportDto request) {
        ReportListDto result = new ReportListDto();
        result.setReportList(reportMapper.selectReportList(request));
        result.setTotal(reportMapper.countReportList(request));
        return result;
    }

    public ReportDto getReport(SearchReportDto request) {
        return reportMapper.getReport(request);
    }

    @Transactional(rollbackFor = Exception.class)
    public void insertReport(ReportDto report, MultipartFile file) {
        if (report == null) {
            throw new BizException("COM000008", null, "Report data is required", HttpStatus.BAD_REQUEST);
        }

        if (file == null || file.isEmpty()) {
            throw new BizException("COM000025", null, "Report template file is required", HttpStatus.BAD_REQUEST);
        }

        try {
            final String usrId = CommonFunction.getUserId();
            final UserInfo userInfo = CommonFunction.getUserInfo();
            final String coId = userInfo.getCoId();

            report.setCoId(coId);
            report.setCreUsrId(usrId);
            report.setUpdUsrId(usrId);

            // Check if report code already exists
            SearchReportDto searchDto = new SearchReportDto();
            searchDto.setCoId(coId);
            searchDto.setRptCd(report.getRptCd());

            int existing = reportMapper.checkDuplicateReportCode(searchDto);
            if (existing > 0) {
                throw new BizException("COM000024", null, "Report Code already exists", HttpStatus.BAD_REQUEST);
            }

            // Save file using FileService with REPORTS path constant
            FileDto savedFile = fileService.saveFile(file, FilePathConstants.REPORTS);
            if (savedFile == null || savedFile.getFileId() == null) {
                throw new BizException("COM000026", null, "Failed to save report file",
                        HttpStatus.INTERNAL_SERVER_ERROR);
            }

            // Set file ID from saved file
            report.setRptFileId(savedFile.getFileId());

            reportMapper.insertReport(report);

        } catch (BizException e) {
            log.error("[ReportService][insertReport] Business error: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("[ReportService][insertReport] Error: {}", e.getMessage(), e);
            throw new BizException("COM000026", null, "Failed to insert report: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateReport(ReportDto report, MultipartFile file) {
        if (report == null) {
            throw new BizException("COM000008", null, "Report data is required", HttpStatus.BAD_REQUEST);
        }

        try {
            final String usrId = CommonFunction.getUserId();
            final UserInfo userInfo = CommonFunction.getUserInfo();
            final String coId = userInfo.getCoId();

            report.setCoId(coId);
            report.setUpdUsrId(usrId);

            // Check if report exists
            SearchReportDto searchUpdateDto = new SearchReportDto();
            searchUpdateDto.setCoId(coId);
            searchUpdateDto.setRptCd(report.getRptCd());

            ReportDto existingReport = reportMapper.getReport(searchUpdateDto);
            if (existingReport == null) {
                throw new BizException("COM000009", null, "Report Not Exists", HttpStatus.BAD_REQUEST);
            }

            // If file is provided, update the file ID
            if (file != null && !file.isEmpty()) {
                // Save file using FileService with REPORTS path constant
                FileDto savedFile = fileService.saveFile(file, FilePathConstants.REPORTS);
                if (savedFile == null || savedFile.getFileId() == null) {
                    throw new BizException("COM000026", null, "Failed to save report file",
                            HttpStatus.INTERNAL_SERVER_ERROR);
                }

                // Set file ID from saved file
                report.setRptFileId(savedFile.getFileId());
            }

            reportMapper.updateReport(report);

        } catch (BizException e) {
            log.error("[ReportService][updateReport] Business error: {}", e.getMessage(), e);
            throw e;
        } catch (Exception e) {
            log.error("[ReportService][updateReport] Error: {}", e.getMessage(), e);
            throw new BizException("COM000026", null, "Failed to update report: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteReport(String coId, String[] rptCdList) {
        reportMapper.deleteReport(coId, rptCdList);
    }

    public byte[] getReportFileAsPdf(String rptCd) {
        try {
            String coId = CommonFunction.getCompanyId();
            SearchReportDto search = new SearchReportDto();
            search.setCoId(coId);
            search.setRptCd(rptCd);
            ReportDto report = reportMapper.getReport(search);

            if (report == null) {
                throw new BizException("COM000009", null, "Report Not Exists", HttpStatus.NOT_FOUND);
            }

            if (report.getRptFileId() == null || report.getRptFileId().trim().isEmpty()) {
                throw new BizException("COM000009", null, "Report File Not Found", HttpStatus.BAD_REQUEST);
            }

            SearchFileDto searchFile = new SearchFileDto();
            searchFile.setCoId(coId);
            searchFile.setFileId(report.getRptFileId());
            FileDto fileDto = fileService.getFile(searchFile);

            if (fileDto == null) {
                throw new BizException("COM000009", null,
                        "Report File Not Exists in database. FileId: " + report.getRptFileId(), HttpStatus.NOT_FOUND);
            }

            File file = new File(fileDto.getFilePath());
            if (!file.exists()) {
                throw new BizException("COM000009", null,
                        "Report File Not Found on Disk. Path: " + file.getAbsolutePath(), HttpStatus.NOT_FOUND);
            }

            if (!file.isFile()) {
                throw new BizException("COM000009", null,
                        "Path exists but is not a file: " + file.getAbsolutePath(), HttpStatus.BAD_REQUEST);
            }

            if (!file.canRead()) {
                throw new BizException("COM000009", null,
                        "File exists but cannot be read: " + file.getAbsolutePath(), HttpStatus.FORBIDDEN);
            }

            byte[] fileBytes = Files.readAllBytes(file.toPath());

            String fileType = fileDto.getFileTp();
            if (fileType == null || fileType.trim().isEmpty()) {
                String fileName = fileDto.getFileNm();
                if (fileName != null && fileName.contains(".")) {
                    fileType = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
                }
            } else {
                fileType = fileType.toLowerCase();
            }

            byte[] pdfBytes;
            if ("pdf".equals(fileType)) {
                pdfBytes = fileBytes;
            } else if ("docx".equals(fileType) || "doc".equals(fileType)) {
                pdfBytes = documentService.convertDocxToPdf(fileBytes);
            } else if ("xlsx".equals(fileType) || "xls".equals(fileType)) {
                pdfBytes = documentService.convertExcelToPdf(fileBytes);
            } else {
                throw new BizException("COM000027", null,
                        "Unsupported file type for PDF conversion: " + fileType, HttpStatus.BAD_REQUEST);
            }

            return pdfBytes;

        } catch (BizException e) {
            log.error("[ReportService][getReportFileAsPdf] Business error: {}", e.getMessage(), e);
            throw e;
        } catch (IOException e) {
            log.error("[ReportService][getReportFileAsPdf] IO error reading file: {}", e.getMessage(), e);
            throw new BizException("COM000026", null, "Failed to read report file: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.error("[ReportService][getReportFileAsPdf] Error: {}", e.getMessage(), e);
            throw new BizException("COM000026", null, "Failed to get report file as PDF: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public byte[] generateReportByCode(String rptCd, Map<String, Object> params) {

        if (params == null) {
            params = new HashMap<>();
        }
        log.info("[ReportService] Generate report: {}", rptCd);
        return null;
    }

    public byte[] generateReport(String rptCd, Map<String, Object> params) {
        String coId = CommonFunction.getCompanyId();
        SearchReportDto search = new SearchReportDto();
        search.setCoId(coId);
        search.setRptCd(rptCd);
        ReportDto report = reportMapper.getReport(search);

        if (report == null) {
            throw new BizException("COM000009", null, "Report Not Exists", HttpStatus.NOT_FOUND);
        }

        if (report.getRptFileId() == null || report.getRptFileId().trim().isEmpty()) {
            throw new BizException("COM000009", null, "Report File Not Found", HttpStatus.BAD_REQUEST);
        }

        SearchFileDto searchFile = new SearchFileDto();
        searchFile.setCoId(coId);
        searchFile.setFileId(report.getRptFileId());
        FileDto fileDto = fileService.getFile(searchFile);

        if (fileDto == null) {
            throw new BizException("COM000009", null,
                    "Report File Not Exists in database. FileId: " + report.getRptFileId(), HttpStatus.NOT_FOUND);
        }

        File file = new File(fileDto.getFilePath());
        if (!file.exists()) {
            throw new BizException("COM000009", null,
                    "Report File Not Found on Disk. Path: " + file.getAbsolutePath(), HttpStatus.NOT_FOUND);
        }

        if (!file.isFile()) {
            throw new BizException("COM000009", null,
                    "Path exists but is not a file: " + file.getAbsolutePath(), HttpStatus.BAD_REQUEST);
        }

        if (!file.canRead()) {
            throw new BizException("COM000009", null,
                    "File exists but cannot be read: " + file.getAbsolutePath(), HttpStatus.FORBIDDEN);
        }

        try {
            return documentService.generateReport(file.getAbsolutePath(), params);
        } catch (Exception e) {
            log.error("[ReportService][generateReport] Error: {}", e.getMessage(), e);
            throw new BizException("COM000026", null, "Failed to generate report: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Resolve report template absolute file path by report code (rptCd).
     * This follows the same validations used in {@link #generateReport(String, Map)}.
     */
    public String resolveReportTemplateFilePath(String rptCd) {
        String coId = CommonFunction.getCompanyId();
        return resolveReportTemplateFilePath(rptCd, coId);
    }

    /**
     * Resolve report template absolute file path by report code (rptCd) and explicit company id.
     * Use this variant in async/background flows where SecurityContext may be unavailable.
     */
    public String resolveReportTemplateFilePath(String rptCd, String coId) {
        SearchReportDto search = new SearchReportDto();
        search.setCoId(coId);
        search.setRptCd(rptCd);
        ReportDto report = reportMapper.getReport(search);

        if (report == null) {
            throw new BizException("COM000009", null, "Report Not Exists", HttpStatus.NOT_FOUND);
        }
        if (report.getRptFileId() == null || report.getRptFileId().trim().isEmpty()) {
            throw new BizException("COM000009", null, "Report File Not Found", HttpStatus.BAD_REQUEST);
        }

        SearchFileDto searchFile = new SearchFileDto();
        searchFile.setCoId(coId);
        searchFile.setFileId(report.getRptFileId());
        FileDto fileDto = fileService.getFile(searchFile);

        if (fileDto == null) {
            throw new BizException("COM000009", null,
                    "Report File Not Exists in database. FileId: " + report.getRptFileId(),
                    HttpStatus.NOT_FOUND);
        }

        File file = new File(fileDto.getFilePath());
        if (!file.exists()) {
            throw new BizException("COM000009", null,
                    "Report File Not Found on Disk. Path: " + file.getAbsolutePath(), HttpStatus.NOT_FOUND);
        }
        if (!file.isFile()) {
            throw new BizException("COM000009", null,
                    "Path exists but is not a file: " + file.getAbsolutePath(), HttpStatus.BAD_REQUEST);
        }
        if (!file.canRead()) {
            throw new BizException("COM000009", null,
                    "File exists but cannot be read: " + file.getAbsolutePath(), HttpStatus.FORBIDDEN);
        }
        return file.getAbsolutePath();
    }

    /**
     * Resolve report template file metadata (COM_FILE row) by report code (rptCd).
     * This follows the same validations used in {@link #generateReport(String, Map)}.
     */
    public FileDto resolveReportTemplateFileMeta(String rptCd) {
        String coId = CommonFunction.getCompanyId();
        SearchReportDto search = new SearchReportDto();
        search.setCoId(coId);
        search.setRptCd(rptCd);
        ReportDto report = reportMapper.getReport(search);

        if (report == null) {
            throw new BizException("COM000009", null, "Report Not Exists", HttpStatus.NOT_FOUND);
        }
        if (report.getRptFileId() == null || report.getRptFileId().trim().isEmpty()) {
            throw new BizException("COM000009", null, "Report File Not Found", HttpStatus.BAD_REQUEST);
        }

        SearchFileDto searchFile = new SearchFileDto();
        searchFile.setCoId(coId);
        searchFile.setFileId(report.getRptFileId());
        FileDto fileDto = fileService.getFile(searchFile);

        if (fileDto == null) {
            throw new BizException("COM000009", null,
                "Report File Not Exists in database. FileId: " + report.getRptFileId(),
                HttpStatus.NOT_FOUND);
        }
        return fileDto;
    }

    public String resolveReportFileExtension(String rptCd) {
        String coId = CommonFunction.getCompanyId();
        SearchReportDto search = new SearchReportDto();
        search.setCoId(coId);
        search.setRptCd(rptCd);
        ReportDto report = reportMapper.getReport(search);

        if (report == null || report.getRptFileId() == null) return "";

        SearchFileDto searchFile = new SearchFileDto();
        searchFile.setCoId(coId);
        searchFile.setFileId(report.getRptFileId());
        FileDto fileDto = fileService.getFile(searchFile);

        if (fileDto == null) return "";

        String fileType = fileDto.getFileTp();
        if (fileType == null || fileType.trim().isEmpty()) {
            String fileName = fileDto.getFileNm();
            if (fileName != null && fileName.contains(".")) {
                fileType = fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
            }
        }
        return fileType == null ? "" : fileType.toLowerCase();
    }

    public byte[] generateReportWithCustomizer(String rptCd, Map<String, Object> params, IDocxCustomizer customizer) {
        String coId = CommonFunction.getCompanyId();
        SearchReportDto search = new SearchReportDto();
        search.setCoId(coId);
        search.setRptCd(rptCd);
        ReportDto report = reportMapper.getReport(search);

        if (report == null) {
            throw new BizException("COM000009", null, "Report Not Exists", HttpStatus.NOT_FOUND);
        }

        if (report.getRptFileId() == null || report.getRptFileId().trim().isEmpty()) {
            throw new BizException("COM000009", null, "Report File Not Found", HttpStatus.BAD_REQUEST);
        }

        SearchFileDto searchFile = new SearchFileDto();
        searchFile.setCoId(coId);
        searchFile.setFileId(report.getRptFileId());
        FileDto fileDto = fileService.getFile(searchFile);

        if (fileDto == null) {
            throw new BizException("COM000009", null,
                    "Report File Not Exists in database. FileId: " + report.getRptFileId(), HttpStatus.NOT_FOUND);
        }

        File file = new File(fileDto.getFilePath());
        if (!file.exists()) {
            throw new BizException("COM000009", null,
                    "Report File Not Found on Disk. Path: " + file.getAbsolutePath(), HttpStatus.NOT_FOUND);
        }

        if (!file.isFile()) {
            throw new BizException("COM000009", null,
                    "Path exists but is not a file: " + file.getAbsolutePath(), HttpStatus.BAD_REQUEST);
        }

        if (!file.canRead()) {
            throw new BizException("COM000009", null,
                    "File exists but cannot be read: " + file.getAbsolutePath(), HttpStatus.FORBIDDEN);
        }

        try {
            return documentService.generateReport(file.getAbsolutePath(), params, customizer);
        } catch (Exception e) {
            log.error("[ReportService][generateReport] Error: {}", e.getMessage(), e);
            throw new BizException("COM000026", null, "Failed to generate report: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public byte[] convertToPdf(byte[] fileBytes) {
        try {
            return documentService.convertFileToPdf(fileBytes);
        } catch (Exception e) {
            log.error("[ReportService][convertToPdf] Error: {}", e.getMessage(), e);
            throw new BizException("COM000026", null, "Failed to convert to PDF: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Merge multiple docx byte arrays into one (e.g. one document per contract/appendix).
     * Each document after the first is appended after a page break.
     *
     * @param docxBytesList list of docx bytes
     * @return merged docx bytes
     */
    public byte[] mergeDocx(List<byte[]> docxBytesList) {
        try {
            return documentService.mergeDocx(docxBytesList);
        } catch (Exception e) {
            log.error("[ReportService][mergeDocx] Error: {}", e.getMessage(), e);
            throw new BizException("COM000026", null, "Failed to merge documents: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
