package com.clt.hrm.infra.utils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Parses dates from Excel import cells. The value must contain {@code /} or {@code -} as a date
 * separator (rejects plain numbers such as Excel serials or typos like {@code 12313}).
 * Tries {@code yyyy-MM-dd}, {@code dd/MM/yyyy}, {@code MM/dd/yyyy}, {@code dd-MM-yyyy},
 * {@code MM-dd-yyyy}, then ISO-8601 {@link LocalDate#parse(CharSequence)}.
 */
public final class ExcelImportDateParser {

    private static final String[] DATE_FORMATS = {
        "yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "dd-MM-yyyy", "MM-dd-yyyy"
    };

    private ExcelImportDateParser() {
    }

    /**
     * @return parsed date, or {@code null} if blank or not parseable
     */
    public static LocalDate parseExcelImportDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            String dateStr = raw.trim();
            if (!dateStr.contains("/") && !dateStr.contains("-")) {
                return null;
            }

            LocalDate parsedDate = null;
            for (String format : DATE_FORMATS) {
                try {
                    parsedDate = LocalDate.parse(dateStr, DateTimeFormatter.ofPattern(format));
                    break;
                } catch (Exception ignored) {
                    // try next format
                }
            }
            if (parsedDate == null) {
                parsedDate = LocalDate.parse(dateStr);
            }
            return parsedDate;
        } catch (Exception e) {
            return null;
        }
    }
}
