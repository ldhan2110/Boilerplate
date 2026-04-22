package com.clt.hrm.infra.report.services;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import org.docx4j.Docx4J;
import org.docx4j.fonts.IdentityPlusMapper;
import org.docx4j.fonts.Mapper;
import org.docx4j.fonts.PhysicalFonts;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.docx4j.openpackaging.parts.WordprocessingML.MainDocumentPart;
import org.docx4j.wml.*;

import java.io.*;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
public class ExcelReportService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DecimalFormat AMOUNT_FORMATTER;

    static {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
        symbols.setGroupingSeparator(',');
        symbols.setDecimalSeparator('.');
        AMOUNT_FORMATTER = new DecimalFormat("#,##0.##", symbols);
        AMOUNT_FORMATTER.setGroupingUsed(true);
    }

    // Matches ${prefix.field}
    private static final Pattern DOT_PLACEHOLDER = Pattern.compile("\\$\\{([a-zA-Z0-9_]+)\\.([a-zA-Z0-9_]+)}");

    // Matches ${key} (no dot) for scalar replacement
    private static final Pattern SCALAR_PLACEHOLDER = Pattern.compile("\\$\\{([a-zA-Z0-9_]+)}");

    // =================== INTERNAL TYPES ===================

    private static final class CellSnapshot {
        final int columnIndex;
        final CellType cellType;
        final CellStyle cellStyle;
        final String stringValue;
        final String formula;
        final double numericValue;
        final boolean booleanValue;

        CellSnapshot(int columnIndex, CellType cellType, CellStyle cellStyle,
                     String stringValue, String formula, double numericValue, boolean booleanValue) {
            this.columnIndex = columnIndex;
            this.cellType = cellType;
            this.cellStyle = cellStyle;
            this.stringValue = stringValue;
            this.formula = formula;
            this.numericValue = numericValue;
            this.booleanValue = booleanValue;
        }
    }

    private static final class TemplateRowInfo {
        final String listKey;
        final int rowIndex;
        final Set<String> fieldNames;
        final List<CellRangeAddress> mergedRegions;

        TemplateRowInfo(String listKey, int rowIndex, Set<String> fieldNames, List<CellRangeAddress> mergedRegions) {
            this.listKey = listKey;
            this.rowIndex = rowIndex;
            this.fieldNames = fieldNames;
            this.mergedRegions = mergedRegions;
        }
    }

    // =================== PUBLIC API ===================

    /**
     * Unified entry point for Excel template processing.
     * <p>
     * Accepts a flat params map. Scalars use {@code ${key}} placeholders.
     * Lists use dot-notation {@code ${listKey.field}} placeholders.
     * Lists are detected by: value is {@code instanceof List}.
     * <p>
     * Template rows containing dot-notation placeholders are expanded per list item.
     * Multiple lists per sheet are supported (processed bottom-up to avoid index shifting).
     * Empty lists cause their template row to be removed.
     *
     * @param templateFilePath path to the .xlsx template file
     * @param params           flat map of scalar values and lists
     * @return generated Excel file as byte array
     */
    public byte[] generateReport(String templateFilePath, Map<String, Object> params) throws Exception {
        File file = new File(templateFilePath);
        if (!file.exists()) {
            throw new FileNotFoundException("Template file not found: " + templateFilePath);
        }

        try (InputStream is = new FileInputStream(file);
             Workbook workbook = new XSSFWorkbook(is);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            if (params == null) params = Map.of();

            // Split params into scalars vs lists
            Map<String, Object> scalarParams = new LinkedHashMap<>();
            Map<String, List<Map<String, Object>>> listParams = new LinkedHashMap<>();

            for (Map.Entry<String, Object> entry : params.entrySet()) {
                String key = entry.getKey();
                Object value = entry.getValue();
                if (value instanceof List<?> rawList) {
                    listParams.put(key, toMapList(rawList));
                } else {
                    scalarParams.put(key, value);
                }
            }

            // Process each sheet
            for (int si = 0; si < workbook.getNumberOfSheets(); si++) {
                Sheet sheet = workbook.getSheetAt(si);
                if (sheet == null) continue;

                // replace placeholders in sheet name
                String sheetName = workbook.getSheetName(si);
                String replacedSheetName = replaceScalarPlaceholders(sheetName, params);
                if (!replacedSheetName.equals(sheetName)) {
                    workbook.setSheetName(si, replacedSheetName);
                }

                // Scan for list template rows on this sheet
                Map<String, TemplateRowInfo> templateRows = scanListTemplateRows(sheet);

                // Sort template rows bottom-up (descending by row index)
                List<TemplateRowInfo> sortedTemplates = new ArrayList<>(templateRows.values());
                sortedTemplates.sort((a, b) -> Integer.compare(b.rowIndex, a.rowIndex));

                // Expand each list template row (bottom-up)
                for (TemplateRowInfo info : sortedTemplates) {
                    List<Map<String, Object>> listData = listParams.get(info.listKey);
                    Row templateRow = sheet.getRow(info.rowIndex);
                    if (templateRow == null) continue;

                    List<CellSnapshot> snapshots = snapshotRow(templateRow);

                    if (listData == null || listData.isEmpty()) {
                        deleteTemplateRow(sheet, info.rowIndex);
                    } else {
                        expandListRows(sheet, info, snapshots, listData);
                    }
                }
            }

            // Apply scalar replacements to all cells across all sheets
            applyScalarParams(workbook, scalarParams);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Fill a single sheet in an existing workbook in-place.
     *
     * Use this when a template requires one sheet per "document" (ex: one employee),
     * but scalar placeholders must be different per sheet within the same output workbook.
     *
     * Rules:
     * - List expansion and scalar replacement are applied ONLY on the specified sheet.
     * - Other sheets are not modified.
     */
    public void fillSheetInPlace(XSSFWorkbook workbook, int sheetIndex, Map<String, Object> params) {
        if (workbook == null) return;
        if (sheetIndex < 0 || sheetIndex >= workbook.getNumberOfSheets()) return;
        if (params == null) params = Map.of();

        // Split params into scalars vs lists
        Map<String, Object> scalarParams = new LinkedHashMap<>();
        Map<String, List<Map<String, Object>>> listParams = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            String key = entry.getKey();
            Object value = entry.getValue();
            if (value instanceof List<?> rawList) {
                listParams.put(key, toMapList(rawList));
            } else {
                scalarParams.put(key, value);
            }
        }

        Sheet sheet = workbook.getSheetAt(sheetIndex);
        if (sheet == null) return;

        // Replace placeholders in sheet name (scalars)
        String sheetName = workbook.getSheetName(sheetIndex);
        String replacedSheetName = replaceScalarPlaceholders(sheetName, params);
        if (!replacedSheetName.equals(sheetName)) {
            workbook.setSheetName(sheetIndex, replacedSheetName);
        }

        // Expand list template rows (bottom-up) on this sheet only
        Map<String, TemplateRowInfo> templateRows = scanListTemplateRows(sheet);
        List<TemplateRowInfo> sortedTemplates = new ArrayList<>(templateRows.values());
        sortedTemplates.sort((a, b) -> Integer.compare(b.rowIndex, a.rowIndex));
        for (TemplateRowInfo info : sortedTemplates) {
            List<Map<String, Object>> listData = listParams.get(info.listKey);
            Row templateRow = sheet.getRow(info.rowIndex);
            if (templateRow == null) continue;
            List<CellSnapshot> snapshots = snapshotRow(templateRow);
            if (listData == null || listData.isEmpty()) {
                deleteTemplateRow(sheet, info.rowIndex);
            } else {
                expandListRows(sheet, info, snapshots, listData);
            }
        }

        // Apply scalar replacements only on this sheet
        applyScalarParamsToSheet(sheet, scalarParams);
    }

    private void applyScalarParamsToSheet(Sheet sheet, Map<String, Object> scalarParams) {
        if (sheet == null) return;
        if (scalarParams == null || scalarParams.isEmpty()) return;

        for (Row row : sheet) {
            if (row == null) continue;
            for (Cell cell : row) {
                if (cell == null) continue;
                if (cell.getCellType() == CellType.STRING) {
                    String text = cell.getStringCellValue();
                    if (text == null || text.isEmpty() || !text.contains("${")) continue;
                    String exactKey = parseExactScalarKey(text);
                    if (exactKey != null && scalarParams.containsKey(exactKey)) {
                        setCellValueTyped(cell, scalarParams.get(exactKey));
                    } else {
                        String replaced = replaceScalarPlaceholders(text, scalarParams);
                        if (!replaced.equals(text)) cell.setCellValue(replaced);
                    }
                } else if (cell.getCellType() == CellType.FORMULA) {
                    String formula = cell.getCellFormula();
                    if (formula == null || formula.isEmpty() || !formula.contains("${")) continue;
                    String replaced = replaceScalarPlaceholders(formula, scalarParams);
                    if (!replaced.equals(formula)) cell.setCellFormula(replaced);
                }
            }
        }
    }

    // =================== SCANNING ===================

    /**
     * Scan a sheet for all ${prefix.field} patterns.
     * Groups by prefix, returning one TemplateRowInfo per unique list prefix.
     */
    private Map<String, TemplateRowInfo> scanListTemplateRows(Sheet sheet) {
        Map<String, Integer> prefixToRow = new LinkedHashMap<>();
        Map<String, Set<String>> prefixToFields = new LinkedHashMap<>();

        for (Row row : sheet) {
            if (row == null) continue;
            for (Cell cell : row) {
                if (cell == null) continue;
                String text = getCellText(cell);
                if (text == null || text.isEmpty()) continue;

                Matcher matcher = DOT_PLACEHOLDER.matcher(text);
                while (matcher.find()) {
                    String prefix = matcher.group(1);
                    String field = matcher.group(2);

                    prefixToRow.putIfAbsent(prefix, row.getRowNum());
                    prefixToFields.computeIfAbsent(prefix, k -> new LinkedHashSet<>()).add(field);
                }
            }
        }

        Map<String, TemplateRowInfo> result = new LinkedHashMap<>();
        for (Map.Entry<String, Integer> entry : prefixToRow.entrySet()) {
            String prefix = entry.getKey();
            int rowIndex = entry.getValue();

            // Collect merged regions on this row
            List<CellRangeAddress> merges = new ArrayList<>();
            for (int i = 0; i < sheet.getNumMergedRegions(); i++) {
                CellRangeAddress addr = sheet.getMergedRegion(i);
                if (addr.getFirstRow() == rowIndex && addr.getLastRow() == rowIndex) {
                    merges.add(addr);
                }
            }

            result.put(prefix, new TemplateRowInfo(prefix, rowIndex, prefixToFields.get(prefix), merges));
        }
        return result;
    }

    // =================== LIST EXPANSION ===================

    /**
     * Expand a single list's template row into N data rows.
     * Assumes bottom-up processing order so row indices remain valid.
     */
    private void expandListRows(
            Sheet sheet,
            TemplateRowInfo templateInfo,
            List<CellSnapshot> snapshots,
            List<Map<String, Object>> listData
    ) {
        int templateRowIndex = templateInfo.rowIndex;
        int dataSize = listData.size();

        // Shift rows below to make room (only if more than 1 item)
        int insertExtra = dataSize - 1;
        if (insertExtra > 0 && sheet.getLastRowNum() > templateRowIndex) {
            sheet.shiftRows(templateRowIndex + 1, sheet.getLastRowNum(), insertExtra);
        }

        // Fill each row
        for (int i = 0; i < dataSize; i++) {
            int targetRowIndex = templateRowIndex + i;
            Row targetRow = sheet.getRow(targetRowIndex);
            if (targetRow == null) targetRow = sheet.createRow(targetRowIndex);

            Map<String, Object> rowData = new LinkedHashMap<>(listData.get(i));
            rowData.put("_rowNum", i + 1);

            fillRowFromSnapshot(snapshots, targetRow, templateInfo.listKey, rowData);

            // Copy merged regions to new rows (skip template row itself — already has them)
            if (i > 0) {
                for (CellRangeAddress addr : templateInfo.mergedRegions) {
                    sheet.addMergedRegion(new CellRangeAddress(
                            targetRowIndex, targetRowIndex,
                            addr.getFirstColumn(), addr.getLastColumn()
                    ));
                }
            }
        }
    }

    /**
     * Delete a template row (empty list case) and shift rows up.
     */
    private void deleteTemplateRow(Sheet sheet, int rowIndex) {
        Row row = sheet.getRow(rowIndex);
        if (row != null) {
            // Remove merged regions on this row
            for (int i = sheet.getNumMergedRegions() - 1; i >= 0; i--) {
                CellRangeAddress addr = sheet.getMergedRegion(i);
                if (addr.getFirstRow() == rowIndex && addr.getLastRow() == rowIndex) {
                    sheet.removeMergedRegion(i);
                }
            }
            sheet.removeRow(row);
        }
        // Shift rows up to fill the gap
        if (rowIndex < sheet.getLastRowNum()) {
            sheet.shiftRows(rowIndex + 1, sheet.getLastRowNum(), -1);
        }
    }

    // =================== SCALAR REPLACEMENT ===================

    /**
     * Replace ${key} (non-dot) placeholders in all cells across all sheets.
     */
    private void applyScalarParams(Workbook workbook, Map<String, Object> scalarParams) {
        if (scalarParams == null || scalarParams.isEmpty()) return;

        for (int si = 0; si < workbook.getNumberOfSheets(); si++) {
            Sheet sheet = workbook.getSheetAt(si);
            if (sheet == null) continue;

            for (Row row : sheet) {
                if (row == null) continue;
                for (Cell cell : row) {
                    if (cell == null) continue;

                    if (cell.getCellType() == CellType.STRING) {
                        String text = cell.getStringCellValue();
                        if (text == null || text.isEmpty()) continue;
                        // Only process if it contains ${
                        if (!text.contains("${")) continue;

                        String exactKey = parseExactScalarKey(text);
                        if (exactKey != null && scalarParams.containsKey(exactKey)) {
                            // Entire cell is one placeholder — set typed value
                            setCellValueTyped(cell, scalarParams.get(exactKey));
                        } else {
                            // Mixed text — string replacement
                            String replaced = replaceScalarPlaceholders(text, scalarParams);
                            if (!replaced.equals(text)) {
                                cell.setCellValue(replaced);
                            }
                        }
                    } else if (cell.getCellType() == CellType.FORMULA) {
                        String formula = cell.getCellFormula();
                        if (formula == null || formula.isEmpty() || !formula.contains("${")) continue;
                        String replaced = replaceScalarPlaceholders(formula, scalarParams);
                        if (!replaced.equals(formula)) {
                            cell.setCellFormula(replaced);
                        }
                    }
                }
            }
        }
    }

    // =================== CELL HELPERS ===================

    /**
     * Snapshot all cells in a row before modification.
     */
    private List<CellSnapshot> snapshotRow(Row row) {
        List<CellSnapshot> snapshots = new ArrayList<>();
        if (row == null) return snapshots;

        for (Cell cell : row) {
            if (cell == null) continue;
            int col = cell.getColumnIndex();
            CellType type = cell.getCellType();
            String str = null;
            String formula = null;
            double num = 0;
            boolean bool = false;

            switch (type) {
                case STRING -> str = cell.getStringCellValue();
                case FORMULA -> formula = cell.getCellFormula();
                case NUMERIC -> num = cell.getNumericCellValue();
                case BOOLEAN -> bool = cell.getBooleanCellValue();
                default -> {}
            }
            snapshots.add(new CellSnapshot(col, type, cell.getCellStyle(), str, formula, num, bool));
        }
        return snapshots;
    }

    /**
     * Fill a target row from snapshots, replacing ${prefix.field} with values from rowData.
     */
    private void fillRowFromSnapshot(
            List<CellSnapshot> snapshots,
            Row targetRow,
            String listPrefix,
            Map<String, Object> rowData
    ) {
        for (CellSnapshot snap : snapshots) {
            Cell targetCell = targetRow.getCell(snap.columnIndex);
            if (targetCell == null) targetCell = targetRow.createCell(snap.columnIndex);
            if (snap.cellStyle != null) targetCell.setCellStyle(snap.cellStyle);

            switch (snap.cellType) {
                case STRING -> {
                    String text = snap.stringValue;
                    if (text == null) text = "";

                    // Check if the entire cell is exactly one ${prefix.field} placeholder
                    String exactField = parseExactDotField(text, listPrefix);
                    if (exactField != null) {
                        setCellValueTyped(targetCell, rowData.get(exactField));
                    } else {
                        // Mixed text — replace all ${prefix.field} occurrences inline
                        targetCell.setCellValue(replaceDotPlaceholders(text, listPrefix, rowData));
                    }
                }
                case FORMULA -> {
                    String f = snap.formula != null ? snap.formula : "";
                    targetCell.setCellFormula(replaceDotPlaceholders(f, listPrefix, rowData));
                }
                case NUMERIC -> targetCell.setCellValue(snap.numericValue);
                case BOOLEAN -> targetCell.setCellValue(snap.booleanValue);
                case BLANK -> targetCell.setBlank();
                default -> {}
            }
        }
    }

    /**
     * Set cell value preserving the correct type for Excel.
     * Numeric values are set as numbers so Excel formatting applies.
     */
    private void setCellValueTyped(Cell cell, Object value) {
        if (cell == null) return;
        if (value == null) {
            cell.setBlank();
            return;
        }
        if (value instanceof BigDecimal bd) {
            cell.setCellValue(bd.doubleValue());
        } else if (value instanceof Number n) {
            cell.setCellValue(n.doubleValue());
        } else if (value instanceof Boolean b) {
            cell.setCellValue(b);
        } else if (value instanceof LocalDate ld) {
            cell.setCellValue(ld.format(DATE_FORMATTER));
        } else if (value instanceof LocalDateTime ldt) {
            cell.setCellValue(ldt.format(DATE_FORMATTER));
        } else if (value instanceof Date d) {
            cell.setCellValue(new java.text.SimpleDateFormat("dd/MM/yyyy").format(d));
        } else {
            cell.setCellValue(String.valueOf(value));
        }
    }

    /**
     * Format a value for inline text replacement.
     */
    private String formatValue(Object value) {
        if (value == null) return "";
        if (value instanceof LocalDate ld) return ld.format(DATE_FORMATTER);
        if (value instanceof LocalDateTime ldt) return ldt.format(DATE_FORMATTER);
        if (value instanceof Date d) return new java.text.SimpleDateFormat("dd/MM/yyyy").format(d);
        if (value instanceof Integer || value instanceof Long)
            return String.format("%,d", ((Number) value).longValue());
        if (value instanceof Double || value instanceof Float || value instanceof BigDecimal)
            return AMOUNT_FORMATTER.format(((Number) value).doubleValue());
        return String.valueOf(value);
    }

    // =================== PLACEHOLDER PARSING ===================

    /**
     * If the cell text is exactly one ${prefix.field} matching the given prefix, return the field name.
     * Returns null if text contains mixed content or a different prefix.
     */
    private String parseExactDotField(String text, String expectedPrefix) {
        if (text == null) return null;
        String trimmed = text.trim();
        Matcher m = DOT_PLACEHOLDER.matcher(trimmed);
        if (m.matches()) {
            String prefix = m.group(1);
            if (prefix.equals(expectedPrefix)) {
                return m.group(2);
            }
        }
        return null;
    }

    /**
     * Replace all ${prefix.field} occurrences for a given prefix with values from rowData.
     */
    private String replaceDotPlaceholders(String text, String listPrefix, Map<String, Object> rowData) {
        if (text == null) return null;
        Matcher matcher = DOT_PLACEHOLDER.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String prefix = matcher.group(1);
            String field = matcher.group(2);
            if (prefix.equals(listPrefix)) {
                Object raw = rowData.get(field);
                matcher.appendReplacement(sb, Matcher.quoteReplacement(formatValue(raw)));
            }
            // If prefix doesn't match, leave placeholder as-is (will be handled by another list or left for scalar pass)
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    /**
     * If the cell text is exactly one ${key} (no dot), return the key.
     * Returns null if text contains mixed content or has a dot.
     */
    private String parseExactScalarKey(String text) {
        if (text == null) return null;
        String trimmed = text.trim();
        Matcher m = SCALAR_PLACEHOLDER.matcher(trimmed);
        if (m.matches()) {
            String key = m.group(1);
            // Make sure it's not a dot placeholder
            if (!trimmed.contains(".")) return key;
        }
        return null;
    }

    /**
     * Replace all ${key} (non-dot) occurrences with formatted scalar values.
     */
    private String replaceScalarPlaceholders(String text, Map<String, Object> scalarParams) {
        if (text == null) return null;
        Matcher matcher = SCALAR_PLACEHOLDER.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String key = matcher.group(1);
            // Skip dot placeholders that weren't resolved (e.g. orphan ${prefix.field})
            String fullMatch = matcher.group(0);
            if (fullMatch.contains(".")) {
                continue;
            }
            if (scalarParams.containsKey(key)) {
                matcher.appendReplacement(sb, Matcher.quoteReplacement(formatValue(scalarParams.get(key))));
            }
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    // =================== UTILITY ===================

    /**
     * Get text content from a cell (STRING or FORMULA).
     */
    private String getCellText(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue();
        if (cell.getCellType() == CellType.FORMULA) return cell.getCellFormula();
        return null;
    }

    /**
     * Convert a raw List<?> to List<Map<String, Object>>.
     * Each item can be a Map already or a POJO (converted via field reflection).
     */
    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> toMapList(List<?> rawList) {
        if (rawList == null || rawList.isEmpty()) return List.of();
        List<Map<String, Object>> result = new ArrayList<>(rawList.size());
        for (Object item : rawList) {
            if (item instanceof Map) {
                result.add((Map<String, Object>) item);
            } else {
                // Convert POJO to map via getter reflection
                result.add(pojoToMap(item));
            }
        }
        return result;
    }

    /**
     * Convert a POJO to a Map using getter methods.
     */
    private Map<String, Object> pojoToMap(Object pojo) {
        Map<String, Object> map = new LinkedHashMap<>();
        try {
            for (java.lang.reflect.Method method : pojo.getClass().getMethods()) {
                String name = method.getName();
                if (method.getParameterCount() != 0) continue;
                if (name.equals("getClass")) continue;

                String fieldName = null;
                if (name.startsWith("get") && name.length() > 3) {
                    fieldName = Character.toLowerCase(name.charAt(3)) + name.substring(4);
                } else if (name.startsWith("is") && name.length() > 2
                        && (method.getReturnType() == boolean.class || method.getReturnType() == Boolean.class)) {
                    fieldName = Character.toLowerCase(name.charAt(2)) + name.substring(3);
                }
                if (fieldName != null) {
                    map.put(fieldName, method.invoke(pojo));
                }
            }
        } catch (Exception e) {
            log.warn("Failed to convert POJO to map: {}", pojo.getClass().getSimpleName(), e);
        }
        return map;
    }

    // =================== SAMPLE / DEMO ===================

    private static final String SAMPLE_TEMPLATE_PATH = "reports/sample_excel_template.xlsx";

    /**
     * Demo the template engine end-to-end:
     * 1. Resolves the sample template from resources/reports/ (creates it if missing)
     * 2. Calls {@link #generateReport(String, Map)} to fill it with sample data
     * 3. Returns the filled Excel bytes
     *
     * The template file is persisted at src/main/resources/reports/sample_excel_template.xlsx
     * so developers can open, inspect, and modify it as a reference for building their own templates.
     *
     * Template structure (3 sheets):
     *   Sheet "Employee List"  — scalar header + ${employees.*} list placeholders
     *   Sheet "Department Summary" — scalar header + ${departments.*} list placeholders
     *   Sheet "Company Info"   — scalar-only placeholders (no list expansion)
     */
    public byte[] generateSampleExcel() {
        try {
            // Step 1 — resolve or create the template
            String templatePath = resolveOrCreateSampleTemplate();

            // Step 2 — prepare sample params (scalars + multiple lists)
            Map<String, Object> params = buildSampleParams();

            // Step 3 — run the template engine
            return generateReport(templatePath, params);

        } catch (Exception e) {
            log.error("[ExcelReportService][generateSampleExcel] Error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate sample Excel via template engine", e);
        }
    }

    /**
     * Resolve the sample template file path.
     * If the file does not exist on disk (e.g. first run or clean build), create it
     * so developers can find, open, and reference it.
     */
    private String resolveOrCreateSampleTemplate() throws Exception {
        // Try classpath resource first (inside jar or build output)
        File templateFile = new File(SAMPLE_TEMPLATE_PATH);

        if (!templateFile.exists()) {
            // Also try absolute from working dir (common in dev)
            log.info("[ExcelReportService] Template not found at '{}', creating it...", SAMPLE_TEMPLATE_PATH);
            templateFile.getParentFile().mkdirs();
            createSampleTemplate(templateFile);
            log.info("[ExcelReportService] Sample template created at '{}'", templateFile.getAbsolutePath());
        } else {
            log.debug("[ExcelReportService] Reusing existing template at '{}'", templateFile.getAbsolutePath());
        }

        return templateFile.getAbsolutePath();
    }

    // ------------------- Sample data -------------------

    private Map<String, Object> buildSampleParams() {
        Map<String, Object> params = new LinkedHashMap<>();

        // Scalar params (used across all sheets)
        params.put("reportTitle", "Employee Report");
        params.put("companyName", "CLT Corporation");
        params.put("generatedDate", LocalDate.now().format(DATE_FORMATTER));
        params.put("department", "All Departments");
        params.put("companyAddress", "123 Nguyen Hue Street, District 1, Ho Chi Minh City");
        params.put("companyPhone", "+84 28 1234 5678");
        params.put("companyEmail", "hr@clt-corp.com");
        params.put("totalEmployees", 10);
        params.put("totalDepartments", 7);
        params.put("reportPeriod", "Q1 2026");

        // List: employees (Sheet 1)
        List<Map<String, Object>> employees = List.of(
            Map.of("name", "John Brown",   "department", "Engineering", "position", "Senior Developer",  "salary", 5000000, "allowance", 500000,  "joinDate", "01/03/2022", "status", "Active"),
            Map.of("name", "Jane Smith",   "department", "Marketing",  "position", "Marketing Manager", "salary", 4500000, "allowance", 400000,  "joinDate", "15/06/2021", "status", "Active"),
            Map.of("name", "Anh Le",       "department", "Engineering", "position", "Tech Lead",         "salary", 6000000, "allowance", 600000,  "joinDate", "01/01/2020", "status", "Active"),
            Map.of("name", "Sarah Kim",    "department", "HR",          "position", "HR Specialist",     "salary", 3800000, "allowance", 350000,  "joinDate", "10/09/2023", "status", "Active"),
            Map.of("name", "Mike Chen",    "department", "Finance",     "position", "Accountant",        "salary", 4200000, "allowance", 380000,  "joinDate", "20/04/2022", "status", "Active"),
            Map.of("name", "Lisa Park",    "department", "Engineering", "position", "Junior Developer",  "salary", 3500000, "allowance", 300000,  "joinDate", "05/11/2023", "status", "Probation"),
            Map.of("name", "David Tran",   "department", "Operations",  "position", "Operations Lead",   "salary", 4800000, "allowance", 450000,  "joinDate", "12/02/2021", "status", "Active"),
            Map.of("name", "Emma Nguyen",  "department", "Design",      "position", "UI/UX Designer",    "salary", 4000000, "allowance", 370000,  "joinDate", "08/07/2022", "status", "Active"),
            Map.of("name", "Tom Wilson",   "department", "Engineering", "position", "DevOps Engineer",   "salary", 5200000, "allowance", 520000,  "joinDate", "25/05/2021", "status", "Active"),
            Map.of("name", "Hana Tanaka",  "department", "QA",          "position", "QA Lead",           "salary", 4600000, "allowance", 420000,  "joinDate", "03/08/2020", "status", "Active")
        );
        params.put("employees", employees);

        // List: departments (Sheet 2)
        List<Map<String, Object>> departments = List.of(
            Map.of("deptName", "Engineering", "headCount", 4, "avgSalary", 4925000, "budget", 25000000, "manager", "Anh Le"),
            Map.of("deptName", "Marketing",   "headCount", 1, "avgSalary", 4500000, "budget", 8000000,  "manager", "Jane Smith"),
            Map.of("deptName", "HR",          "headCount", 1, "avgSalary", 3800000, "budget", 5000000,  "manager", "Sarah Kim"),
            Map.of("deptName", "Finance",     "headCount", 1, "avgSalary", 4200000, "budget", 6000000,  "manager", "Mike Chen"),
            Map.of("deptName", "Operations",  "headCount", 1, "avgSalary", 4800000, "budget", 7000000,  "manager", "David Tran"),
            Map.of("deptName", "Design",      "headCount", 1, "avgSalary", 4000000, "budget", 5500000,  "manager", "Emma Nguyen"),
            Map.of("deptName", "QA",          "headCount", 1, "avgSalary", 4600000, "budget", 6500000,  "manager", "Hana Tanaka")
        );
        params.put("departments", departments);

        return params;
    }

    // ------------------- Template creation -------------------

    /**
     * Creates a multi-sheet .xlsx template file with ${placeholder} cells.
     * Exercises both scalar and list placeholder features across 3 sheets.
     *
     * Developers can open this file in Excel to understand the placeholder syntax:
     *   - Scalar: ${key}           — replaced with a single value
     *   - List:   ${listKey.field} — template row is expanded per list item
     *   - Auto:   ${listKey._rowNum} — auto-incremented row number (1-based)
     */
    private void createSampleTemplate(File outputFile) throws Exception {
        try (Workbook workbook = new XSSFWorkbook();
             FileOutputStream fos = new FileOutputStream(outputFile)) {

            // --- Shared styles ---
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);

            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            CellStyle amountStyle = workbook.createCellStyle();
            amountStyle.cloneStyleFrom(dataStyle);
            amountStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));

            CellStyle infoStyle = workbook.createCellStyle();
            Font infoFont = workbook.createFont();
            infoFont.setItalic(true);
            infoStyle.setFont(infoFont);

            CellStyle labelStyle = workbook.createCellStyle();
            Font labelFont = workbook.createFont();
            labelFont.setBold(true);
            labelStyle.setFont(labelFont);

            // ===================== Sheet 1: Employee List =====================
            Sheet empSheet = workbook.createSheet("Employee List");
            buildTemplateRow(empSheet, 0, titleStyle, "Report: ${reportTitle}");
            buildInfoRow(empSheet, 1, infoStyle,
                "Company: ${companyName}", "Generated: ${generatedDate}", "Department: ${department}");

            String[] empHeaders = {"No", "Name", "Department", "Position", "Salary", "Allowance", "Join Date", "Status"};
            buildHeaderRow(empSheet, 3, headerStyle, empHeaders);

            String[] empPlaceholders = {
                "${employees._rowNum}", "${employees.name}", "${employees.department}",
                "${employees.position}", "${employees.salary}", "${employees.allowance}",
                "${employees.joinDate}", "${employees.status}"
            };
            boolean[] empAmountCols = {false, false, false, false, true, true, false, false};
            buildPlaceholderRow(empSheet, 4, dataStyle, amountStyle, empPlaceholders, empAmountCols);

            int[] empWidths = {2000, 5000, 4000, 5000, 4000, 4000, 3500, 3000};
            setColumnWidths(empSheet, empWidths);

            // ===================== Sheet 2: Department Summary =====================
            Sheet deptSheet = workbook.createSheet("Department Summary");
            buildTemplateRow(deptSheet, 0, titleStyle, "Department Summary — ${reportTitle}");
            buildInfoRow(deptSheet, 1, infoStyle,
                "Company: ${companyName}", "Period: ${reportPeriod}", "Total Depts: ${totalDepartments}");

            String[] deptHeaders = {"No", "Department", "Head Count", "Avg Salary", "Budget", "Manager"};
            buildHeaderRow(deptSheet, 3, headerStyle, deptHeaders);

            String[] deptPlaceholders = {
                "${departments._rowNum}", "${departments.deptName}", "${departments.headCount}",
                "${departments.avgSalary}", "${departments.budget}", "${departments.manager}"
            };
            boolean[] deptAmountCols = {false, false, false, true, true, false};
            buildPlaceholderRow(deptSheet, 4, dataStyle, amountStyle, deptPlaceholders, deptAmountCols);

            int[] deptWidths = {2000, 5000, 3500, 4000, 4000, 5000};
            setColumnWidths(deptSheet, deptWidths);

            // ===================== Sheet 3: Company Info (scalar only) =====================
            Sheet infoSheet = workbook.createSheet("Company Info");
            buildTemplateRow(infoSheet, 0, titleStyle, "Company Information");

            String[][] infoRows = {
                {"Company Name",    "${companyName}"},
                {"Address",         "${companyAddress}"},
                {"Phone",           "${companyPhone}"},
                {"Email",           "${companyEmail}"},
                {"Total Employees", "${totalEmployees}"},
                {"Total Departments", "${totalDepartments}"},
                {"Report Period",   "${reportPeriod}"},
                {"Generated Date",  "${generatedDate}"},
            };
            for (int i = 0; i < infoRows.length; i++) {
                Row row = infoSheet.createRow(i + 2);
                Cell labelCell = row.createCell(0);
                labelCell.setCellValue(infoRows[i][0]);
                labelCell.setCellStyle(labelStyle);
                Cell valueCell = row.createCell(1);
                valueCell.setCellValue(infoRows[i][1]);
                valueCell.setCellStyle(dataStyle);
            }
            infoSheet.setColumnWidth(0, 6000);
            infoSheet.setColumnWidth(1, 10000);

            workbook.write(fos);
        }
    }

    // ------------------- Template builder helpers -------------------

    private void buildTemplateRow(Sheet sheet, int rowIdx, CellStyle style, String value) {
        Row row = sheet.createRow(rowIdx);
        Cell cell = row.createCell(0);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private void buildInfoRow(Sheet sheet, int rowIdx, CellStyle style, String... values) {
        Row row = sheet.createRow(rowIdx);
        for (int i = 0; i < values.length; i++) {
            Cell cell = row.createCell(i * 2);
            cell.setCellValue(values[i]);
            cell.setCellStyle(style);
        }
    }

    private void buildHeaderRow(Sheet sheet, int rowIdx, CellStyle style, String[] headers) {
        Row row = sheet.createRow(rowIdx);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(style);
        }
    }

    private void buildPlaceholderRow(Sheet sheet, int rowIdx, CellStyle dataStyle,
                                     CellStyle amountStyle, String[] placeholders, boolean[] isAmount) {
        Row row = sheet.createRow(rowIdx);
        for (int i = 0; i < placeholders.length; i++) {
            Cell cell = row.createCell(i);
            cell.setCellValue(placeholders[i]);
            cell.setCellStyle(isAmount[i] ? amountStyle : dataStyle);
        }
    }

    private void setColumnWidths(Sheet sheet, int[] widths) {
        for (int i = 0; i < widths.length; i++) {
            sheet.setColumnWidth(i, widths[i]);
        }
    }

    // =================== LEGACY METHODS (backward compatibility) ===================

    /**
     * Legacy placeholder patterns (supports both ${key} and {key}).
     */
    private static final Pattern LEGACY_PLACEHOLDER_ANY = Pattern.compile("\\$\\{([a-zA-Z0-9_]+)}|\\{([a-zA-Z0-9_]+)}");

    private String legacyReplacePlaceholders(String text, Map<String, Object> values) {
        if (text == null || values == null) return text;
        Matcher matcher = LEGACY_PLACEHOLDER_ANY.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            String key = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);
            Object raw = values.get(key);
            String replacement = formatValue(raw);
            matcher.appendReplacement(sb, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }

    private String legacyParseExactPlaceholderKey(String text) {
        if (text == null) return null;
        String trimmed = text.trim();
        Pattern dollarPat = Pattern.compile("\\$\\{([a-zA-Z0-9_]+)}");
        Matcher m1 = dollarPat.matcher(trimmed);
        if (m1.matches()) return m1.group(1);
        Pattern bracePat = Pattern.compile("\\{([a-zA-Z0-9_]+)}");
        Matcher m2 = bracePat.matcher(trimmed);
        if (m2.matches()) return m2.group(1);
        return null;
    }

    private static final class LegacyCellSnapshot {
        final int columnIndex;
        final CellType cellType;
        final CellStyle cellStyle;
        final String stringValue;
        final String formula;
        final double numericValue;
        final boolean booleanValue;

        LegacyCellSnapshot(int columnIndex, CellType cellType, CellStyle cellStyle,
                           String stringValue, String formula, double numericValue, boolean booleanValue) {
            this.columnIndex = columnIndex;
            this.cellType = cellType;
            this.cellStyle = cellStyle;
            this.stringValue = stringValue;
            this.formula = formula;
            this.numericValue = numericValue;
            this.booleanValue = booleanValue;
        }
    }

    private List<LegacyCellSnapshot> legacySnapshotRow(Row row) {
        List<LegacyCellSnapshot> list = new ArrayList<>();
        if (row == null) return list;
        for (Cell cell : row) {
            if (cell == null) continue;
            int col = cell.getColumnIndex();
            CellType t = cell.getCellType();
            String str = null;
            String formula = null;
            double num = 0;
            boolean bool = false;
            switch (t) {
                case STRING -> str = cell.getStringCellValue();
                case FORMULA -> formula = cell.getCellFormula();
                case NUMERIC -> num = cell.getNumericCellValue();
                case BOOLEAN -> bool = cell.getBooleanCellValue();
                default -> {}
            }
            list.add(new LegacyCellSnapshot(col, t, cell.getCellStyle(), str, formula, num, bool));
        }
        return list;
    }

    private void legacyFillFromSnapshots(List<LegacyCellSnapshot> snapshots, Row targetRow, Map<String, Object> mergedParams) {
        for (LegacyCellSnapshot snap : snapshots) {
            Cell targetCell = targetRow.getCell(snap.columnIndex);
            if (targetCell == null) targetCell = targetRow.createCell(snap.columnIndex);
            if (snap.cellStyle != null) targetCell.setCellStyle(snap.cellStyle);

            switch (snap.cellType) {
                case STRING -> {
                    String text = snap.stringValue != null ? snap.stringValue : "";
                    String exactKey = legacyParseExactPlaceholderKey(text);
                    if (exactKey != null) {
                        setCellValueTyped(targetCell, mergedParams.get(exactKey));
                    } else {
                        targetCell.setCellValue(legacyReplacePlaceholders(text, mergedParams));
                    }
                }
                case FORMULA -> {
                    String f = snap.formula != null ? snap.formula : "";
                    targetCell.setCellFormula(legacyReplacePlaceholders(f, mergedParams));
                }
                case NUMERIC -> targetCell.setCellValue(snap.numericValue);
                case BOOLEAN -> targetCell.setCellValue(snap.booleanValue);
                case BLANK -> targetCell.setBlank();
                default -> {}
            }
        }
    }

    private Set<String> legacyExtractPlaceholderKeys(String text) {
        if (text == null || text.isEmpty()) return Set.of();
        Set<String> keys = new HashSet<>();
        Pattern dollarPat = Pattern.compile("\\$\\{([a-zA-Z0-9_]+)}");
        Matcher m1 = dollarPat.matcher(text);
        while (m1.find()) keys.add(m1.group(1));
        Pattern bracePat = Pattern.compile("\\{([a-zA-Z0-9_]+)}");
        Matcher m2 = bracePat.matcher(text);
        while (m2.find()) keys.add(m2.group(1));
        return keys;
    }

    private int legacyDetectTemplateRowIndex(Sheet sheet, Set<String> placeholderKeys) {
        int bestRow = -1;
        int bestScore = 0;
        for (Row row : sheet) {
            if (row == null) continue;
            int score = 0;
            for (Cell cell : row) {
                if (cell == null || cell.getCellType() != CellType.STRING) continue;
                String text = cell.getStringCellValue();
                if (text == null || text.isEmpty()) continue;
                Set<String> keys = legacyExtractPlaceholderKeys(text);
                if (placeholderKeys != null && !placeholderKeys.isEmpty()) {
                    for (String k : keys) if (placeholderKeys.contains(k)) score++;
                } else {
                    score += keys.size();
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestRow = row.getRowNum();
            }
        }
        return bestRow;
    }

    private static final class LegacyFilledRange {
        final String sheetName;
        final int firstRow;
        final int lastRowInclusive;

        LegacyFilledRange(String sheetName, int firstRow, int lastRowInclusive) {
            this.sheetName = sheetName;
            this.firstRow = firstRow;
            this.lastRowInclusive = lastRowInclusive;
        }
    }

    private LegacyFilledRange legacyExpandSheet(
            Sheet sheet, int templateRowIndexHint, Set<String> placeholderKeys,
            List<Map<String, Object>> rowData, Map<String, Object> globalParams
    ) {
        int templateRowIndex = templateRowIndexHint;
        if (templateRowIndex < 0) {
            templateRowIndex = legacyDetectTemplateRowIndex(sheet, placeholderKeys);
        }
        if (templateRowIndex < 0) return null;

        Row templateRow = sheet.getRow(templateRowIndex);
        if (templateRow == null) {
            throw new IllegalArgumentException("Template row not found at index: " + templateRowIndex
                    + " in sheet: " + sheet.getSheetName());
        }

        List<CellRangeAddress> templateRowMerges = new ArrayList<>();
        for (int i = 0; i < sheet.getNumMergedRegions(); i++) {
            CellRangeAddress addr = sheet.getMergedRegion(i);
            if (addr.getFirstRow() == templateRowIndex && addr.getLastRow() == templateRowIndex) {
                templateRowMerges.add(addr);
            }
        }

        if (!rowData.isEmpty()) {
            List<LegacyCellSnapshot> snapshots = legacySnapshotRow(templateRow);
            int insertExtra = rowData.size() - 1;
            if (insertExtra > 0) {
                sheet.shiftRows(templateRowIndex + 1, sheet.getLastRowNum(), insertExtra);
            }
            for (int i = 0; i < rowData.size(); i++) {
                int targetRowIndex = templateRowIndex + i;
                Row targetRow = sheet.getRow(targetRowIndex);
                if (targetRow == null) targetRow = sheet.createRow(targetRowIndex);
                Map<String, Object> merged = new LinkedHashMap<>();
                merged.putAll(globalParams);
                merged.putAll(rowData.get(i));
                legacyFillFromSnapshots(snapshots, targetRow, merged);
                if (i > 0) {
                    for (CellRangeAddress addr : templateRowMerges) {
                        sheet.addMergedRegion(new CellRangeAddress(
                                targetRowIndex, targetRowIndex,
                                addr.getFirstColumn(), addr.getLastColumn()
                        ));
                    }
                }
            }
        } else {
            Map<String, Object> merged = new LinkedHashMap<>(globalParams);
            Row targetRow = sheet.getRow(templateRowIndex);
            if (targetRow == null) targetRow = sheet.createRow(templateRowIndex);
            List<LegacyCellSnapshot> snapshots = legacySnapshotRow(templateRow);
            legacyFillFromSnapshots(snapshots, targetRow, merged);
        }

        int dataEndRow = rowData.isEmpty() ? templateRowIndex : (templateRowIndex + rowData.size() - 1);
        return new LegacyFilledRange(sheet.getSheetName(), templateRowIndex, dataEndRow);
    }

    private void legacyApplyGlobalParams(Workbook workbook, Map<String, Object> globalParams, List<LegacyFilledRange> filledRanges) {
        for (int si = 0; si < workbook.getNumberOfSheets(); si++) {
            Sheet sheet = workbook.getSheetAt(si);
            if (sheet == null) continue;

            LegacyFilledRange rangeForSheet = null;
            for (LegacyFilledRange r : filledRanges) {
                if (r != null && sheet.getSheetName().equals(r.sheetName)) {
                    rangeForSheet = r;
                    break;
                }
            }

            for (int r = 0; r <= sheet.getLastRowNum(); r++) {
                if (rangeForSheet != null && r >= rangeForSheet.firstRow && r <= rangeForSheet.lastRowInclusive) continue;
                Row row = sheet.getRow(r);
                if (row == null) continue;
                for (Cell cell : row) {
                    if (cell == null) continue;
                    if (cell.getCellType() == CellType.STRING) {
                        String cv = cell.getStringCellValue();
                        if (cv == null || cv.isEmpty()) continue;
                        String replaced = legacyReplacePlaceholders(cv, globalParams);
                        if (!replaced.equals(cv)) cell.setCellValue(replaced);
                    } else if (cell.getCellType() == CellType.FORMULA) {
                        String f = cell.getCellFormula();
                        if (f == null || f.isEmpty()) continue;
                        String replaced = legacyReplacePlaceholders(f, globalParams);
                        if (!replaced.equals(f)) cell.setCellFormula(replaced);
                    }
                }
            }
        }
    }

    /**
     * Legacy: expand template rows per worksheet index.
     * Kept for backward compatibility with existing callers.
     */
    public byte[] generateExcelByTemplateWithRowDataPerSheetIndex(
            String templateFilePath,
            Map<Integer, List<Map<String, Object>>> rowDataBySheetIndex,
            Map<String, Object> globalParams
    ) throws Exception {
        File file = new File(templateFilePath);
        try (InputStream is = new FileInputStream(file);
             Workbook workbook = new XSSFWorkbook(is);
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            if (globalParams == null) globalParams = Map.of();
            if (rowDataBySheetIndex == null) rowDataBySheetIndex = Map.of();

            List<LegacyFilledRange> filledRanges = new ArrayList<>();

            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                if (!rowDataBySheetIndex.containsKey(i)) continue;
                List<Map<String, Object>> rowsForSheet = rowDataBySheetIndex.get(i);
                if (rowsForSheet == null) continue;
                Sheet sheet = workbook.getSheetAt(i);
                if (sheet == null) continue;

                Set<String> keys = rowsForSheet.isEmpty() ? Set.of() : rowsForSheet.get(0).keySet();
                LegacyFilledRange range = legacyExpandSheet(sheet, -1, keys, rowsForSheet, globalParams);
                if (range != null) filledRanges.add(range);
            }

            if (filledRanges.isEmpty()) {
                throw new IllegalArgumentException(
                        "No sheet was filled: rowDataBySheetIndex had no matching sheet index or no detectable template row");
            }

            legacyApplyGlobalParams(workbook, globalParams, filledRanges);

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // =================== EXCEL → PDF ===================

    /**
     * Convert Excel bytes to PDF via intermediate DOCX.
     */
    public byte[] convertExcelToPdf(byte[] excelBytes) throws Exception {
        try (InputStream is = new ByteArrayInputStream(excelBytes);
             Workbook workbook = new XSSFWorkbook(is)) {
            WordprocessingMLPackage wordMLPackage = WordprocessingMLPackage.createPackage();
            Mapper fontMapper = buildFontMapper();
            wordMLPackage.setFontMapper(fontMapper);
            MainDocumentPart documentPart = wordMLPackage.getMainDocumentPart();
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                Sheet sheet = workbook.getSheetAt(i);
                addHeading(documentPart, sheet.getSheetName(), 1);
                convertSheetToTable(documentPart, sheet);
                if (i < workbook.getNumberOfSheets() - 1) {
                    documentPart.addParagraphOfText("");
                }
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Docx4J.toPDF(wordMLPackage, out);
            return out.toByteArray();
        }
    }

    private Mapper buildFontMapper() throws Exception {
        Mapper fontMapper = new IdentityPlusMapper();
        PhysicalFonts.addPhysicalFont(new File("fonts/NotoSans-Regular.ttf").toURI());
        PhysicalFonts.addPhysicalFont(new File("fonts/Manrope-Bold.ttf").toURI());
        PhysicalFonts.addPhysicalFont(new File("fonts/Manrope-Medium.ttf").toURI());
        PhysicalFonts.addPhysicalFont(new File("fonts/Manrope-SemiBold.ttf").toURI());
        fontMapper.put("Times New Roman", PhysicalFonts.get("Manrope-Regular"));
        fontMapper.put("Calibri", PhysicalFonts.get("Manrope-Regular"));
        fontMapper.put("Arial", PhysicalFonts.get("Manrope-Regular"));
        fontMapper.put("Manrope", PhysicalFonts.get("Manrope-Regular"));
        fontMapper.put("Serif", PhysicalFonts.get("NotoSans-Regular"));
        fontMapper.put("SansSerif", PhysicalFonts.get("NotoSans-Regular"));
        return fontMapper;
    }

    private void addHeading(MainDocumentPart documentPart, String text, int level) {
        ObjectFactory factory = new ObjectFactory();
        P p = factory.createP();
        Text t = factory.createText();
        t.setValue(text);
        R r = factory.createR();
        r.getContent().add(t);
        PPr ppr = factory.createPPr();
        PPrBase.PStyle style = factory.createPPrBasePStyle();
        style.setVal("Heading" + level);
        ppr.setPStyle(style);
        p.setPPr(ppr);
        p.getContent().add(r);
        documentPart.getContent().add(p);
    }

    private void addTableCell(Tr row, String text, boolean bold) {
        ObjectFactory factory = new ObjectFactory();
        Tc cell = factory.createTc();
        P p = factory.createP();
        Text t = factory.createText();
        t.setValue(text);
        R run = factory.createR();
        run.getContent().add(t);
        if (bold) {
            RPr rpr = factory.createRPr();
            BooleanDefaultTrue b = new BooleanDefaultTrue();
            rpr.setB(b);
            run.setRPr(rpr);
        }
        p.getContent().add(run);
        cell.getContent().add(p);
        row.getContent().add(cell);
    }

    private void convertSheetToTable(MainDocumentPart documentPart, Sheet sheet) {
        ObjectFactory factory = new ObjectFactory();
        Tbl table = factory.createTbl();
        for (Row row : sheet) {
            Tr tr = factory.createTr();
            for (Cell cell : row) {
                addTableCell(tr, getCellDisplayValue(cell), false);
            }
            table.getContent().add(tr);
        }
        documentPart.getContent().add(table);
    }

    private String getCellDisplayValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getLocalDateTimeCellValue().format(DATE_FORMATTER);
                }
                return String.valueOf(cell.getNumericCellValue());
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            default:
                return "";
        }
    }
}
