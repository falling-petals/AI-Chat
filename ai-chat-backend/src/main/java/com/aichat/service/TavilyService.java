package com.aichat.service;

import com.aichat.dto.SearchResult;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class TavilyService {

    private static final Logger log = LoggerFactory.getLogger(TavilyService.class);
    private static final String TAVILY_URL = "https://api.tavily.com/search";

    private final String apiKey;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public TavilyService(@Value("${tavily.api-key}") String apiKey) {
        this.apiKey = apiKey;
        this.restClient = RestClient.create();
        this.objectMapper = new ObjectMapper();
    }

    public List<SearchResult> search(String query) {
        if (apiKey == null || apiKey.isBlank() || "placeholder".equals(apiKey)) {
            log.warn("Tavily API Key 未配置");
            return List.of();
        }

        try {
            Map<String, Object> body = Map.of(
                    "api_key", apiKey,
                    "query", query,
                    "search_depth", "basic",
                    "max_results", 5
            );

            String json = restClient.post()
                    .uri(TAVILY_URL)
                    .body(body)
                    .retrieve()
                    .body(String.class);

            if (json == null) return List.of();

            TavilyResponse resp = objectMapper.readValue(json, TavilyResponse.class);
            return resp.getResults() != null ? resp.getResults() : List.of();
        } catch (Exception e) {
            log.error("Tavily 搜索失败: {}", e.getMessage());
            return List.of();
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class TavilyResponse {
        private List<SearchResult> results;
        public List<SearchResult> getResults() { return results; }
        public void setResults(List<SearchResult> results) { this.results = results; }
    }
}
