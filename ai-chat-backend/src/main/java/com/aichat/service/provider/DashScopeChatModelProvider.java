package com.aichat.service.provider;

import com.aichat.entity.ModelConfig;
import com.alibaba.cloud.ai.dashscope.api.DashScopeApi;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatOptions;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

@Component("dashscope")
public class DashScopeChatModelProvider implements ChatModelProvider {

    private static final String[] MULTIMODAL_MODEL_PREFIXES = {
        "qwen-vl", "qwen2.5-vl", "qwen2-vl", "qwen-audio"
    };

    private final DashScopeChatModel defaultChatModel;

    public DashScopeChatModelProvider(DashScopeChatModel defaultChatModel) {
        this.defaultChatModel = defaultChatModel;
    }

    @Override
    public Flux<ChatResponse> stream(Prompt prompt, ModelConfig config) {
        String baseUrl = normalizeBaseUrl(config.getBaseUrl());
        DashScopeApi api = (baseUrl != null && !baseUrl.isBlank())
                ? DashScopeApi.builder().apiKey(config.getApiKey()).baseUrl(baseUrl).build()
                : DashScopeApi.builder().apiKey(config.getApiKey()).build();

        DashScopeChatOptions options = DashScopeChatOptions.builder()
                .withModel(config.getModelName())
                .build();

        if (isMultiModal(config.getModelName())) {
            options.setMultiModel(true);
        }

        DashScopeChatModel model = defaultChatModel.mutate()
                .dashScopeApi(api)
                .defaultOptions(options)
                .build();

        return model.stream(prompt);
    }

    static boolean isMultiModal(String modelName) {
        if (modelName == null || modelName.isBlank()) return false;
        String lower = modelName.toLowerCase();
        for (String prefix : MULTIMODAL_MODEL_PREFIXES) {
            if (lower.startsWith(prefix)) return true;
        }
        return false;
    }

    private static String normalizeBaseUrl(String baseUrl) {
        if (baseUrl == null || baseUrl.isBlank()) return baseUrl;
        return baseUrl.replaceAll("/v1/?$", "");
    }
}
