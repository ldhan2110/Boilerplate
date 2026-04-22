package com.clt.hrm.infra.common.dtos;

import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for i18n-backend response
 * Format: { "en": { "MSG001": "Hello", "MSG002": "World" }, "ko": { ... } }
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class I18nMessagesDto {
    /**
     * Map where key is language code (e.g., "en", "ko")
     * and value is a map of messageId -> translated message value
     */
    private Map<String, Map<String, String>> messages;
}

