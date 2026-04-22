package com.clt.hrm.infra.ai.config;


import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class ModelConfig {
    @Bean
	ChatModel ollamaModel(
        @Value("${langchain4j.ollama.base-url}") String baseUrl, 
        @Value("${langchain4j.ollama.model-name}") String model
    ) {
		return OllamaChatModel.builder()
			.baseUrl(baseUrl)
			.modelName(model)
			.temperature(0.0)
			.build();
	}

	@Bean
	ChatModel geminiModel(
		@Value("${langchain4j.google-ai.gemini.api-key}") String apiKey,
		@Value("${langchain4j.google-ai.gemini.model-name}") String model
	) {
		return GoogleAiGeminiChatModel.builder()
			.apiKey(apiKey)
			.modelName(model)
			.build();
	}

	@Bean
	@ConditionalOnProperty(name = "openrouter.enabled", havingValue = "true", matchIfMissing = false)
	ChatModel openRouterModel(
			@Value("${openrouter.api-key}") String apiKey,
			@Value("${openrouter.model-name}") String modelName) {
		return OpenAiChatModel.builder()
				.baseUrl("https://openrouter.ai/api/v1")
				.apiKey(apiKey)
				.modelName(modelName)
				.temperature(0.1)
				.build();
	}
}
