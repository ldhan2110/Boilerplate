package com.clt.hrm.infra.utils;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import com.clt.hrm.infra.common.dtos.ParsedSearchTextDto;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;

import com.clt.hrm.core.authentication.entities.UserInfo;
import com.clt.hrm.infra.common.dtos.DynamicFilterDto;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class CommonFunction {
    private static final ObjectMapper mapper = new ObjectMapper();
    private static final NumToViet NUM_TO_VIET = new NumToViet();
    private static final Pattern ACCENT_MARKS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    public static String getUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserInfo userInfo = (UserInfo) authentication.getPrincipal();
        return userInfo.getUsername().split("::")[1];
    }

    public static String getCompanyId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserInfo userInfo = (UserInfo) authentication.getPrincipal();
        return userInfo.getUsername().split("::")[0];
    }

    public static UserInfo getUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserInfo userInfo = (UserInfo) authentication.getPrincipal();
        return userInfo;
    }

    public static DynamicFilterDto convertFilterValue(DynamicFilterDto filter) {
        if (filter.getValue() == null || "".equals(filter.getValue()) || filter == null) {
            return null;
        }

        Object value = filter.getValue(); // could be String, Number, Boolean, List, etc.
        Object valueTo = filter.getValueTo();

        if ("BETWEEN".equals(filter.getOperator())) {
            if (valueTo == null || value == null || "".equals(value) || "".equals(valueTo)) {
                throw new IllegalArgumentException("Invalid value: " + value);
            }
            switch (filter.getValueType()) {
                case "DATE":
                    filter.setValue(value.toString());
                    filter.setValueTo(valueTo.toString());
                    break;
                case "NUMBER":
                    if (value instanceof Number && valueTo instanceof Number) {
                        filter.setValue(value);
                        filter.setValueTo(value);
                        break;
                    }
                    throw new IllegalArgumentException("Invalid number value: " + value);
                default:
                    throw new IllegalArgumentException("Unsupported valueType: " + filter.getValueType());
            }
        } else {
            switch (filter.getValueType()) {
                case "TIME":
                case "DATE":
                case "STRING":
                    filter.setValue(value.toString());
                    break;
                case "NUMBER":
                    if (value instanceof Number) {
                        filter.setValue(value);
                        break;
                    }
                    throw new IllegalArgumentException("Invalid number value: " + value);
                case "BOOLEAN":
                    if (value instanceof Boolean) {
                        filter.setValue(value);
                        break;
                    } else if (value instanceof String) {
                        filter.setValue(Boolean.parseBoolean((String) value));
                        break;
                    }
                    throw new IllegalArgumentException("Invalid boolean value: " + value);
                case "ARRAY":
                    // Convert array-like values to List<Object>
                    if (value instanceof List) {
                        filter.setValue(value);
                        break;
                    }
                    // If JSON array as string or JsonNode
                    filter.setValue(mapper.convertValue(value, List.class));
                    break;
                default:
                    throw new IllegalArgumentException("Unsupported valueType: " + filter.getValueType());
            }
        }
        return filter;
    }

    /**
     * Helper method to normalize a single list filter: if list contains "ALL", set to null
     * This allows frontend to send "ALL" to indicate "no filter" for that field
     *
     * @param list   the list to check
     * @param setter the setter method to call if "ALL" is found
     */
    public static void normalizeListFilter(List<String> list, java.util.function.Consumer<List<String>> setter) {
        if (list != null && !list.isEmpty() && list.stream().anyMatch("ALL"::equalsIgnoreCase)) {
            setter.accept(null);
        }
    }


    public static List<String> convertToFilterList(String commaSeparatedString) {
        if (!StringUtils.hasText(commaSeparatedString)) {
            return Collections.emptyList();
        }
        return Arrays.stream(commaSeparatedString.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .collect(Collectors.toList());
    }

    /**
     * Converts comma-separated search text to a list of tokens for code/name IN search.
     * Use when searching records where code OR name matches any token in the list.
     * Delegates to {@link #convertToFilterList(String)}.
     *
     * @param searchText raw search text (e.g. "code1, code2, name1, name2")
     * @return list of trimmed non-empty tokens, or empty list if null/blank
     */
    public static List<String> buildSearchTextTokens(String searchText) {
        return convertToFilterList(searchText);
    }

    public static ParsedSearchTextDto parse(String rawSearch) {
        if (rawSearch == null || rawSearch.isBlank()) {
            return new ParsedSearchTextDto(null, null);
        }

        List<String> codes = new ArrayList<>();
        List<String> names = new ArrayList<>();

        for (String part : rawSearch.split("[,;]")) {
            String token = part.trim();
            if (token.isEmpty()) continue;

            if (token.chars().allMatch(Character::isDigit)) {
                codes.add(token);
            } else {
                names.add(token);
            }
        }

        return new ParsedSearchTextDto(
                codes.isEmpty() ? null : codes,
                names.isEmpty() ? null : names
        );
    }

    /**
     * Converts a numeric value to its Vietnamese text representation.
     * <p>
     * Example usage:
     * <pre>
     *     spellOutVietNumber(123) → "một trăm hai mươi ba"
     *     spellOutVietNumber(1000000) → "một triệu"
     * </pre>
     *
     * @param number the numeric value to convert (can be positive or negative)
     * @return the Vietnamese text representation of the number
     * @see NumToViet#format(long)
     */
    public static String spellOutVietNumber(long number) {
        return NUM_TO_VIET.format(number);
    }

    /**
     * Removes all accent marks (diacritics) from a Vietnamese string and converts it to plain ASCII.
     * <p>
     * Example usage:
     * <pre>
     *     stripAccents("Tiếng Việt") → "Tieng Viet"
     *     stripAccents("Đặng Thị Hương") → "Dang Thi Huong"
     *     stripAccents("café") → "cafe"
     * </pre>
     *
     * @param s the string to remove accents from; can be null
     * @return the input string with all accents removed, or null if input is null
     */
    public static String stripAccents(String s) {
        if (s == null) return null;

        // 1. Decompose characters into base + accent
        String temp = Normalizer.normalize(s, Normalizer.Form.NFD);

        // 2. Remove all accent marks (Combining Diacritical Marks)
        temp = ACCENT_MARKS_PATTERN.matcher(temp).replaceAll("");

        // 3. Handle the 'Đ' and 'đ' specifically
        return temp.replace("đ", "d").replace("Đ", "D");
    }
}
