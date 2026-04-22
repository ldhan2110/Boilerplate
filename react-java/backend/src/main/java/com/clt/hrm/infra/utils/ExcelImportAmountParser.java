package com.clt.hrm.infra.utils;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.DateUtil;

/**
 * Parses money amounts from Excel import (numeric cells and formatted strings):
 * US thousands ({@code 1,234.56}), European ({@code 1.234,56} / {@code 1234,56}), strips spaces and
 * common currency symbols. Result is scaled to 2 decimal places (half-up).
 */
public final class ExcelImportAmountParser {

    private static final int MONEY_SCALE = 2;

    private ExcelImportAmountParser() {
    }

    /**
     * Reads a money value from a cell: numeric (non-date) uses the stored value; otherwise parses
     * {@link DataFormatter} text via {@link #parseMoneyAmount(String)}.
     */
    public static BigDecimal parseMoneyCell(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return null;
        }
        CellType type = cell.getCellType();
        if (type == CellType.FORMULA) {
            type = cell.getCachedFormulaResultType();
        }
        if (type == CellType.NUMERIC && !DateUtil.isCellDateFormatted(cell)) {
            double v = cell.getNumericCellValue();
            return new BigDecimal(Double.toString(v)).setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        }
        String text = formatter.formatCellValue(cell);
        return parseMoneyAmount(text);
    }

    /**
     * @return normalized amount, or {@code null} if blank / not a valid number
     */
    public static BigDecimal parseMoneyAmount(String raw) {
        if (raw == null) {
            return null;
        }
        String s = raw.trim();
        if (s.isEmpty()) {
            return null;
        }
        s = s.replace('\u00A0', ' ').replaceAll("\\s+", "");

        boolean negative = false;
        if (s.startsWith("(") && s.endsWith(")")) {
            negative = true;
            s = s.substring(1, s.length() - 1).trim();
        }
        if (s.startsWith("-")) {
            negative = !negative;
            s = s.substring(1).trim();
        }
        if (s.isEmpty()) {
            return null;
        }

        // Strip common currency / unit noise (keep digits, separators)
        s = s.replaceAll("(?i)^[\\$€£¥฿₫]+\\s*", "");
        s = s.replaceAll("(?i)\\s*(USD|EUR|VND|GBP)\\s*$", "");
        s = s.trim();
        if (s.isEmpty()) {
            return null;
        }

        int lastComma = s.lastIndexOf(',');
        int lastDot = s.lastIndexOf('.');
        if (lastComma >= 0 && lastDot < 0) {
            int afterComma = s.length() - 1 - lastComma;
            if (afterComma == 3 && s.indexOf(',') == lastComma) {
                s = s.replace(",", "");
            } else {
                s = s.replace(",", ".");
            }
        } else if (lastComma > lastDot) {
            s = s.replace(".", "").replace(',', '.');
        } else {
            s = s.replace(",", "");
        }

        if (s.isEmpty() || ".".equals(s)) {
            return null;
        }

        try {
            BigDecimal bd = new BigDecimal(s);
            if (negative) {
                bd = bd.negate();
            }
            return bd.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
