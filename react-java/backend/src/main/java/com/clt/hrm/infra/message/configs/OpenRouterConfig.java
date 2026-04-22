package com.clt.hrm.infra.message.configs;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.openai.OpenAiChatModel;

@Configuration
public class OpenRouterConfig {

	@Bean
	@Qualifier("openRouterModel")
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
