package com.clt.hrm.infra.report.services;

import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.util.JRLoader;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;

import java.io.InputStream;
import java.sql.Connection;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class JasperReportService {

    @Autowired
    private ResourceLoader resourceLoader;

    @Autowired
    private DataSource dataSource;

    public byte[] exportToPdf(String reportName, Map<String, Object> parameters) throws JRException {
        try {
            log.info("[JasperReportService] Starting PDF export for report: {}", reportName);

            // Load and compile the report
            JasperReport report = loadReport(reportName);
            log.info("[JasperReportService] Report loaded successfully: {}", reportName);

            // Fill the report with data
            JasperPrint print;
            if (report.getMainDataset() != null && report.getMainDataset().getQuery() != null) {
                log.info("[JasperReportService] Report has database query, using database connection");
                try (Connection connection = dataSource.getConnection()) {
                    print = JasperFillManager.fillReport(report, parameters, connection);
                }
            } else {
                log.info("[JasperReportService] Report has no database query, filling without connection");
                print = JasperFillManager.fillReport(report, parameters);
            }

            log.info("[JasperReportService] Report filled successfully");

            // Export to PDF
            byte[] pdfBytes = JasperExportManager.exportReportToPdf(print);
            log.info("[JasperReportService] PDF exported successfully, size: {} bytes", pdfBytes.length);

            return pdfBytes;
        } catch (Exception e) {
            log.error("[JasperReportService] [exportToPdf] Error generating PDF report: {}", e.getMessage(), e);
            throw new JRException("Failed to generate PDF report: " + reportName, e);
        }
    }

    public byte[] exportToPdfWithData(String reportName, Map<String, Object> parameters, List<?> data)
            throws JRException {
        try {
            log.info("[JasperReportService] [exportToPdfWithData] Starting PDF export with data for report: {}",
                    reportName);

            // Load and compile the report
            JasperReport report = loadReport(reportName);
            log.info("[JasperReportService] [exportToPdfWithData] Report loaded successfully: {}", reportName);

            // Create data source from the provided data
            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(data);
            parameters.put("REPORT_DATA_SOURCE", dataSource);

            // Fill the report
            JasperPrint print = JasperFillManager.fillReport(report, parameters, dataSource);
            log.info("[JasperReportService] [exportToPdfWithData] Report filled successfully with {} records",
                    data.size());

            // Export to PDF
            byte[] pdfBytes = JasperExportManager.exportReportToPdf(print);
            log.info("[JasperReportService] [exportToPdfWithData] PDF exported successfully, size: {} bytes",
                    pdfBytes.length);

            return pdfBytes;
        } catch (Exception e) {
            log.error("[JasperReportService] [exportToPdfWithData] Error generating PDF report with data: {}",
                    e.getMessage(), e);
            throw new JRException("Failed to generate PDF report: " + reportName, e);
        }
    }

    private JasperReport loadReport(String reportName) throws JRException {
        try {
            String resourcePath = "classpath:reports/" + reportName + ".jasper";
            log.info("[JasperReportService] [loadReport] Loading compiled report from: {}", resourcePath);

            var resource = resourceLoader.getResource(resourcePath);
            if (!resource.exists()) {
                log.error("[JasperReportService] [loadReport] Compiled report not found: {}", resourcePath);
                throw new JRException("Compiled report file not found: " + resourcePath);
            }

            try (InputStream inputStream = resource.getInputStream()) {
                JasperReport report = (JasperReport) JRLoader.loadObject(inputStream);
                log.info("[JasperReportService] [loadReport] Compiled report loaded successfully: {}", reportName);
                return report;
            }
        } catch (Exception e) {
            log.error("[JasperReportService] [loadReport] Error loading compiled report: {}", reportName, e);
            throw new JRException("Failed to load compiled report: " + reportName, e);
        }
    }
}
