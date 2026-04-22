package com.clt.hrm.infra.ai.config;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.langchain4j.memory.chat.ChatMemoryProvider;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.TokenCountEstimator;
import dev.langchain4j.model.googleai.GoogleAiGeminiTokenCountEstimator;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Configuration
public class MemoryProviderConfig {
    @Bean
	ChatMemoryProvider ollamaChatMemoryProvider() {
		return memoryId -> MessageWindowChatMemory.builder()
				.id(memoryId)
				.alwaysKeepSystemMessageFirst(true)
				.maxMessages(10)
				.build();
	}

	@Bean
	ChatMemoryProvider geminiChatMemoryProvider(@Qualifier("geminiTokenEstimator") TokenCountEstimator estimator) {
		Map<Object, MessageWindowChatMemory> memories = new ConcurrentHashMap<>();
		return memoryId -> memories.computeIfAbsent(memoryId, id ->
			MessageWindowChatMemory.builder()
				.id(id)
				.alwaysKeepSystemMessageFirst(true)
				.maxMessages(50)
				.build()
		);
	}

	@Bean
	TokenCountEstimator geminiTokenEstimator(
        @Value("${langchain4j.google-ai.gemini.model-name}") String modelName, 
        @Value("${langchain4j.google-ai.gemini.api-key}") String apiKey
    ) {
		return GoogleAiGeminiTokenCountEstimator.builder()
			.modelName(modelName)
			.apiKey(apiKey)
			.build();
	}
}
