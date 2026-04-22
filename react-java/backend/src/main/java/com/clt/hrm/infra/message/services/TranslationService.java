package com.clt.hrm.infra.message.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.clt.hrm.infra.message.dtos.MessageTranslationDto;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import dev.langchain4j.model.chat.ChatModel;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class TranslationService {

	private static final Map<String, String> LANGUAGE_NAMES = Map.of(
			"en", "English",
			"kr", "Korean",
			"vn", "Vietnamese");

	@Autowired(required = false)
	@Qualifier("openRouterModel")
	private ChatModel openRouterModel;

	@Value("${openrouter.enabled:false}")
	private boolean openRouterEnabled;

	private final ObjectMapper objectMapper = new ObjectMapper();

	/**
	 * Translate a default message into the target languages using OpenRouter AI.
	 * Falls back to defaultMessage for each language on any failure.
	 */
	public List<MessageTranslationDto> translateMessage(String defaultMessage, List<String> targetLanguages) {
		if (!openRouterEnabled || openRouterModel == null || targetLanguages.isEmpty()) {
			return buildFallbackTranslations(defaultMessage, targetLanguages);
		}

		try {
			String languageList = targetLanguages.stream()
					.map(lang -> lang + " (" + LANGUAGE_NAMES.getOrDefault(lang, lang) + ")")
					.reduce((a, b) -> a + ", " + b)
					.orElse("");

			String prompt = String.format(
					"Translate the following UI message into the requested languages.\n"
							+ "Return ONLY a JSON object with language codes as keys and translations as values.\n"
							+ "Do not include any explanation, markdown, or code fences.\n\n"
							+ "Message: \"%s\"\n"
							+ "Languages: %s\n\n"
							+ "Example output format: {\"kr\": \"...\", \"vn\": \"...\"}",
					defaultMessage, languageList);

			String response = openRouterModel.chat(prompt);
			return parseTranslationResponse(response, defaultMessage, targetLanguages);
		} catch (Exception e) {
			log.warn("[TranslationService] OpenRouter translation failed, using fallback. Error: {}", e.getMessage());
			return buildFallbackTranslations(defaultMessage, targetLanguages);
		}
	}

	private List<MessageTranslationDto> parseTranslationResponse(String response, String defaultMessage,
			List<String> targetLanguages) {
		List<MessageTranslationDto> translations = new ArrayList<>();

		try {
			// Clean response: remove markdown code fences if present
			String cleaned = response.trim();
			if (cleaned.startsWith("```")) {
				cleaned = cleaned.replaceAll("^```[a-z]*\\n?", "").replaceAll("\\n?```$", "").trim();
			}

			Map<String, String> translationMap = objectMapper.readValue(cleaned,
					new TypeReference<Map<String, String>>() {
					});

			for (String lang : targetLanguages) {
				MessageTranslationDto dto = new MessageTranslationDto();
				dto.setLangVal(lang);
				dto.setTransMsgVal(translationMap.getOrDefault(lang, defaultMessage));
				translations.add(dto);
			}
		} catch (Exception e) {
			log.warn("[TranslationService] Failed to parse AI response, using fallback. Response: {}", response);
			return buildFallbackTranslations(defaultMessage, targetLanguages);
		}

		return translations;
	}

	private List<MessageTranslationDto> buildFallbackTranslations(String defaultMessage, List<String> targetLanguages) {
		List<MessageTranslationDto> translations = new ArrayList<>();
		for (String lang : targetLanguages) {
			MessageTranslationDto dto = new MessageTranslationDto();
			dto.setLangVal(lang);
			dto.setTransMsgVal(defaultMessage);
			translations.add(dto);
		}
		return translations;
	}
}
