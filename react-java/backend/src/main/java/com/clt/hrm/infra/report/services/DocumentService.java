package com.clt.hrm.infra.report.services;

import com.clt.hrm.infra.report.interfaces.IDocxCustomizer;
import com.clt.hrm.infra.utils.ReportUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.docx4j.Docx4J;
import org.docx4j.XmlUtils;
import org.docx4j.fonts.IdentityPlusMapper;
import org.docx4j.fonts.Mapper;
import org.docx4j.fonts.PhysicalFonts;
import org.docx4j.model.datastorage.migration.VariablePrepare;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.*;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
public class DocumentService {

    @Autowired
    private RestTemplate restTemplate;

    @Autowired
    private ExcelReportService excelReportService;

    @Value("${report.converter.url}")
    private String reportConverterUrl;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DecimalFormat AMOUNT_FORMATTER;

    static {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
        symbols.setGroupingSeparator(',');
        symbols.setDecimalSeparator('.');
        AMOUNT_FORMATTER = new DecimalFormat("#,##0.##", symbols);
        AMOUNT_FORMATTER.setGroupingUsed(true);
    }

    // ========================= FONT MAPPER =========================

    private Mapper buildFontMapperAuto() throws Exception {

        Mapper fontMapper = new IdentityPlusMapper();

        // ===== SERVER PRIMARY FONT =====
        PhysicalFonts.addPhysicalFont(new File("fonts/NotoSans-Regular.ttf").toURI());
        PhysicalFonts.addPhysicalFont(new File("fonts/Manrope-Bold.ttf").toURI());
        PhysicalFonts.addPhysicalFont(new File("fonts/Manrope-Medium.ttf").toURI());
        PhysicalFonts.addPhysicalFont(new File("fonts/Manrope-SemiBold.ttf").toURI());

        // ===== SAFE FALLBACK =====
        PhysicalFonts.addPhysicalFont(new File("fonts/NotoSans-Regular.ttf").toURI());

        // ===== TEMPLATE ALIAS =====
        fontMapper.put("Times New Roman", PhysicalFonts.get("Manrope-Regular"));
        fontMapper.put("Calibri", PhysicalFonts.get("Manrope-Regular"));
        fontMapper.put("Arial", PhysicalFonts.get("Manrope-Regular"));
        fontMapper.put("Manrope", PhysicalFonts.get("Manrope-Regular"));

        // Last fallback
        fontMapper.put("Serif", PhysicalFonts.get("NotoSans-Regular"));
        fontMapper.put("SansSerif", PhysicalFonts.get("NotoSans-Regular"));

        log.info("===== Loaded Fonts =====");
        PhysicalFonts.getPhysicalFonts().forEach((k, v) ->
                log.info("FONT: {}", k)
        );

        return fontMapper;
    }

    // ========================= DOCX GENERATE =========================
    public byte[] generateReport(String filePath, Map<String, Object> params) throws Exception {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new FileNotFoundException("File not found: " + filePath);
        }

        String fileName = file.getName().toLowerCase();

        // Delegate Excel files to ExcelReportService
        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            return excelReportService.generateReport(filePath, params);
        }

        // Also try to detect Excel by file content (more robust)
        // Try to open as Excel first - if it succeeds, it's Excel
        try (InputStream is = new FileInputStream(file)) {
            try {
                Workbook testWorkbook = new XSSFWorkbook(is);
                testWorkbook.close();
                // If we can open it as Excel, it's an Excel file
                log.info("File detected as Excel by content, using Excel processor: {}", filePath);
                return excelReportService.generateReport(filePath, params);
            } catch (Exception e) {
                // Not an Excel file, continue with DOCX processing
                // Reopen the stream for DOCX processing
            }
        }

        // Process as DOCX
        try (InputStream is = new FileInputStream(file)) {
            WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.load(is);
            Mapper fontMapper = buildFontMapperAuto();
            wordMLPackage.setFontMapper(fontMapper);

            VariablePrepare.prepare(wordMLPackage);
            MainDocumentPart documentPart = wordMLPackage.getMainDocumentPart();
            HashMap<String, List<Object>> listParams = new HashMap<>();
            HashMap<String, Object> objectParams = new HashMap<>();

            params.forEach((k, v) -> {
                if (k.endsWith("List") && v instanceof List) {
                    listParams.put(k, (List<Object>) v);
                } else {
                    objectParams.put(k, v);
                }
            });
            processObjectParams(documentPart, objectParams);
            processListParams(documentPart, listParams);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wordMLPackage.save(out);
            return out.toByteArray();
        }
    }

    public byte[] generateReport(String filePath, Map<String, Object> params, IDocxCustomizer customizer) throws Exception {
        File file = new File(filePath);
        String fileName = file.getName().toLowerCase();

        if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            throw new IllegalArgumentException("Excel files are not supported with customizer. Use generateReport() without customizer for Excel files.");
        }

        try (InputStream is = new FileInputStream(file)) {
            WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.load(is);
            Mapper fontMapper = buildFontMapperAuto();
            wordMLPackage.setFontMapper(fontMapper);

            VariablePrepare.prepare(wordMLPackage);
            MainDocumentPart documentPart = wordMLPackage.getMainDocumentPart();
            HashMap<String, List<Object>> listParams = new HashMap<>();
            HashMap<String, Object> objectParams = new HashMap<>();

            params.forEach((k, v) -> {
                if (k.endsWith("List") && v instanceof List) {
                    listParams.put(k, (List<Object>) v);
                } else {
                    objectParams.put(k, v);
                }
            });
            processObjectParams(documentPart, objectParams);
            processListParams(documentPart, listParams);

            customizer.customize(wordMLPackage, documentPart, params);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wordMLPackage.save(out);
            return out.toByteArray();
        }
    }

    // ========================= PARAM PROCESS =========================
    private void processObjectParams(MainDocumentPart documentPart, HashMap<String, Object> objectParams) throws Exception {
        Map<String, String> formattedParams = formatParams(objectParams);
        formattedParams.replaceAll((k, v) -> Normalizer.normalize(v, Normalizer.Form.NFC));
        documentPart.variableReplace(formattedParams);
        ReportUtils.expandNewlinesToLineBreaksInParagraphs(documentPart);
    }

    @SuppressWarnings("unchecked")
    private void processListParams(MainDocumentPart documentPart, HashMap<String, List<Object>> listParams) {
        ObjectMapper objectMapper = new ObjectMapper();
        for (Map.Entry<String, List<Object>> entry : listParams.entrySet()) {
            String tag = entry.getKey();
            List<Object> dataList = entry.getValue();
            List<Map<String, Object>> mapList = new ArrayList<>();
            for (Object item : dataList) {
                if (item instanceof Map) {
                    mapList.add((Map<String, Object>) item);
                } else {
                    Map<String, Object> map = objectMapper.convertValue(
                            item,
                            new TypeReference<Map<String, Object>>() {
                        }
                    );
                    mapList.add(map);
                }
            }
            ReportUtils.processListObjects(documentPart, tag, mapList);
        }
    }

    // ========================= FORMAT =========================
    private Map<String, String> formatParams(Map<String, Object> params) {
        Map<String, String> formatted = new HashMap<>();
        params.forEach((k, v) -> formatted.put(k, formatValue(v)));
        return formatted;
    }

    private String formatValue(Object value) {
        if (value == null) return "";
        if (value instanceof LocalDate)
            return ((LocalDate) value).format(DATE_FORMATTER);
        if (value instanceof LocalDateTime)
            return ((LocalDateTime) value).format(DATE_FORMATTER);
        if (value instanceof Date)
            return new java.text.SimpleDateFormat("dd/MM/yyyy").format(value);
        if (value instanceof Integer || value instanceof Long)
            return String.format("%,d", ((Number) value).longValue());
        if (value instanceof Double || value instanceof Float || value instanceof BigDecimal)
            return AMOUNT_FORMATTER.format(((Number) value).doubleValue());
        return value.toString();
    }

    // ========================= DOCX → PDF =========================
    public byte[] convertDocxToPdf(byte[] docxBytes) throws Exception {
        try (ByteArrayInputStream is = new ByteArrayInputStream(docxBytes)) {
            WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.load(is);
            Mapper fontMapper = buildFontMapperAuto();
            wordMLPackage.setFontMapper(fontMapper);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Docx4J.toPDF(wordMLPackage, out);
            return out.toByteArray();
        }
    }

    /**
     * Merge multiple docx documents into one. Each document after the first is
     * appended after a page break.
     */
    public byte[] mergeDocx(List<byte[]> docxBytesList) throws Exception {
        if (docxBytesList == null || docxBytesList.isEmpty()) {
            return new byte[0];
        }
        if (docxBytesList.size() == 1) {
            return docxBytesList.get(0);
        }
        try (ByteArrayInputStream firstIs = new ByteArrayInputStream(docxBytesList.get(0))) {
            WordprocessingMLPackage destPkg = WordprocessingMLPackage.load(firstIs);
            MainDocumentPart destPart = destPkg.getMainDocumentPart();
            Mapper fontMapper = buildFontMapperAuto();
            destPkg.setFontMapper(fontMapper);

            for (int i = 1; i < docxBytesList.size(); i++) {
                byte[] nextDoc = docxBytesList.get(i);
                ReportUtils.addPageBreak(destPart);
                try (ByteArrayInputStream nextIs = new ByteArrayInputStream(nextDoc)) {
                    WordprocessingMLPackage srcPkg = WordprocessingMLPackage.load(nextIs);
                    List<Object> srcContent = srcPkg.getMainDocumentPart().getContent();
                    for (Object obj : srcContent) {
                        Object copy = XmlUtils.deepCopy(obj);
                        destPart.getContent().add(copy);
                    }
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            destPkg.save(out);
            return out.toByteArray();
        }
    }

    // ========================= EXCEL → PDF (delegates) =========================
    public byte[] convertExcelToPdf(byte[] excelBytes) throws Exception {
        return excelReportService.convertExcelToPdf(excelBytes);
    }

    // ========================= FILE → PDF (external converter) =========================
    public byte[] convertFileToPdf(byte[] fileBytes) throws Exception {
         ByteArrayResource fileResource = new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return "report.pdf";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", fileResource);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);
        ResponseEntity<byte[]> response = restTemplate.exchange(reportConverterUrl+"/conversion?format=pdf", HttpMethod.POST, request,byte[].class);
        if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
            throw new IllegalStateException("PDF conversion failed");
        }
        return response.getBody();
    }
}
