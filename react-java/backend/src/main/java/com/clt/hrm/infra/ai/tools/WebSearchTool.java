package com.clt.hrm.infra.ai.tools;

import dev.langchain4j.agent.tool.Tool;
import dev.langchain4j.web.search.WebSearchEngine;
import dev.langchain4j.web.search.WebSearchResults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class WebSearchTool {
    private WebSearchEngine webSearchEngine;

    public WebSearchTool(WebSearchEngine webSearchEngine) {
        this.webSearchEngine = webSearchEngine;
    }

    @Tool(
        """
            Search the web for up-to-date or real-world information.
            Use this when the user asks about current events, news,
            recent updates, or information not guaranteed to be in memory.
        """
    )
    public String searchWeb(String query) {
        log.info("Searching the web for: {}", query);
        WebSearchResults results = webSearchEngine.search(query);
        return results.results().stream()
                .limit(5)
                .map(r -> """
                    Title: %s
                    URL: %s
                    Content: %s
                    """.formatted(r.title(), r.url(), r.content()))
                .reduce("", (a, b) -> a + "\n" + b);
    }
}
