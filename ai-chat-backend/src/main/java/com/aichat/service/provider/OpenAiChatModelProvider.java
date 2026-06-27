package com.aichat.service.provider;

import com.aichat.entity.ModelConfig;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;

@Component("openai")
public class OpenAiChatModelProvider implements ChatModelProvider {

    @Override
    public Flux<ChatResponse> stream(Prompt prompt, ModelConfig config) {
        String baseUrl = config.getBaseUrl();
        OpenAiApi api = (baseUrl != null && !baseUrl.isBlank())
                ? OpenAiApi.builder().apiKey(config.getApiKey()).baseUrl(baseUrl).build()
                : OpenAiApi.builder().apiKey(config.getApiKey()).build();

        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(config.getModelName())
                .build();

        OpenAiChatModel model = OpenAiChatModel.builder()
                .openAiApi(api)
                .defaultOptions(options)
                .build();

        return model.stream(prompt);
    }
}
