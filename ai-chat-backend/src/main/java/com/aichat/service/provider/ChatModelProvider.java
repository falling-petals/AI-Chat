package com.aichat.service.provider;

import com.aichat.entity.ModelConfig;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import reactor.core.publisher.Flux;

public interface ChatModelProvider {
    Flux<ChatResponse> stream(Prompt prompt, ModelConfig config);
}
