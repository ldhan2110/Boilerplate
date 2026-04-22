package com.clt.hrm.infra.ai.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import dev.langchain4j.rag.content.retriever.ContentRetriever;
import dev.langchain4j.rag.content.retriever.WebSearchContentRetriever;
import dev.langchain4j.web.search.WebSearchEngine;
import dev.langchain4j.web.search.tavily.TavilyWebSearchEngine;

@Configuration
public class WebSearchToolConfig {
    @Bean
    WebSearchEngine webSearchEngine(@Value("${tavily.api-key}") String apiKey) {
        return TavilyWebSearchEngine.builder()
        .apiKey(apiKey)
        .build();
    }

    @Bean
    ContentRetriever webSearchContentRetriever(WebSearchEngine webSearchEngine) {
        return WebSearchContentRetriever.builder()
                .webSearchEngine(webSearchEngine)
                .maxResults(3)
                .build();
    }
}
