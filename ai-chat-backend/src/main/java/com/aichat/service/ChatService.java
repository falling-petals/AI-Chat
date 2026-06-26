package com.aichat.service;

import com.aichat.entity.Conversation;
import com.aichat.entity.Message;
import com.aichat.entity.ModelConfig;
import com.aichat.mapper.MessageMapper;
import com.alibaba.cloud.ai.dashscope.api.DashScopeApi;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatOptions;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatService.class);

    private final DashScopeChatModel defaultChatModel;
    private final ModelConfigService modelConfigService;
    private final ConversationService conversationService;
    private final MessageMapper messageMapper;

    public ChatService(DashScopeChatModel defaultChatModel,
                       ModelConfigService modelConfigService,
                       ConversationService conversationService,
                       MessageMapper messageMapper) {
        this.defaultChatModel = defaultChatModel;
        this.modelConfigService = modelConfigService;
        this.conversationService = conversationService;
        this.messageMapper = messageMapper;
    }

    public SseEmitter stream(Long userId, Long conversationId, String content) {
        SseEmitter emitter = new SseEmitter(0L);
        log.debug("stream() called: userId={}, conversationId={}, content={}", userId, conversationId, content);

        ModelConfig config = modelConfigService.getActive(userId);
        if (config == null) {
            log.warn("No active model config for userId={}", userId);
            sendEvent(emitter, "error", "请先在设置页面配置并激活模型");
            emitter.complete();
            return emitter;
        }
        if (!"dashscope".equalsIgnoreCase(config.getProvider())) {
            log.warn("Unsupported provider for streaming: userId={}, provider={}", userId, config.getProvider());
            sendEvent(emitter, "error", "当前仅支持 dashscope，请在设置中切换到 dashscope 模型");
            emitter.complete();
            return emitter;
        }
        log.debug("Active model config: provider={}, model={}, baseUrl={}", config.getProvider(), config.getModelName(), config.getBaseUrl());

        Conversation conv = conversationService.getById(conversationId, userId);
        if (conv == null) {
            log.warn("Conversation not found: id={}, userId={}", conversationId, userId);
            sendEvent(emitter, "error", "Conversation not found");
            emitter.complete();
            return emitter;
        }

        Message userMsg = new Message();
        userMsg.setConversationId(conversationId);
        userMsg.setRole("user");
        userMsg.setContent(content);
        messageMapper.insert(userMsg);
        log.debug("User message saved: id={}", userMsg.getId());

        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();
        if (conv.getSystemPrompt() != null && !conv.getSystemPrompt().isBlank()) {
            messages.add(new org.springframework.ai.chat.messages.SystemMessage(conv.getSystemPrompt()));
            log.debug("Added system prompt: {}", conv.getSystemPrompt());
        }
        messages.add(new UserMessage(content));

        log.debug("Building DashScopeApi...");
        String baseUrl = config.getBaseUrl();
        DashScopeApi userApi = (baseUrl != null && !baseUrl.isBlank())
                ? DashScopeApi.builder().apiKey(config.getApiKey()).baseUrl(baseUrl).build()
                : DashScopeApi.builder().apiKey(config.getApiKey()).build();
        log.debug("DashScopeApi built");

        DashScopeChatOptions userOptions = DashScopeChatOptions.builder()
                .withModel(config.getModelName())
                .build();

        log.debug("Mutating default DashScopeChatModel...");
        DashScopeChatModel userModel = defaultChatModel.mutate()
                .dashScopeApi(userApi)
                .defaultOptions(userOptions)
                .build();
        log.debug("User-specific DashScopeChatModel created, model={}", config.getModelName());

        StringBuilder fullContent = new StringBuilder();
        StringBuilder fullThinking = new StringBuilder();

        try {
            log.debug("Starting stream...");
            userModel.stream(new Prompt(messages)).subscribe(
                    chunk -> {
                        ChatResponse response = (ChatResponse) chunk;
                        var metadata = response.getResult().getOutput().getMetadata();
                        if (metadata != null) {
                            Object reasoningObj = metadata.get("reasoningContent");
                            if (reasoningObj instanceof String reasoning && !reasoning.isBlank()) {
                                fullThinking.append(reasoning);
                                sendEvent(emitter, "thinking", reasoning);
                                log.debug("SSE thinking event sent, thinking accumulated={}", fullThinking.length());
                            }
                        }
                        String text = response.getResult().getOutput().getText();
                        if (text != null && !text.isBlank()) {
                            fullContent.append(text);
                            sendEvent(emitter, "message", text);
                            log.debug("SSE message event sent, accumulated={}", fullContent.length());
                        }
                    },
                    error -> {
                        log.error("Stream error: {}", error.getMessage(), error);
                        sendEvent(emitter, "error", error.getMessage());
                        emitter.complete();
                    },
                    () -> {
                        log.debug("Stream completed, saving assistant message");
                        Message assistantMsg = new Message();
                        assistantMsg.setConversationId(conversationId);
                        assistantMsg.setRole("assistant");
                        assistantMsg.setContent(fullContent.toString());
                        if (!fullThinking.isEmpty()) {
                            assistantMsg.setThinking(fullThinking.toString());
                        }
                        messageMapper.insert(assistantMsg);

                        sendEvent(emitter, "done", "");
                        emitter.complete();
                        log.debug("SSE done event sent");
                    }
            );
            log.debug("Subscription returned, emitter ready");
        } catch (Exception e) {
            log.error("Stream setup error: {}", e.getMessage(), e);
            sendEvent(emitter, "error", e.getMessage());
            emitter.complete();
        }

        return emitter;
    }

    private void sendEvent(SseEmitter emitter, String name, String data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data));
        } catch (IOException ignored) {}
    }
}
