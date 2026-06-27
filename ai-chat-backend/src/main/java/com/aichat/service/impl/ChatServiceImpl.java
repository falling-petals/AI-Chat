package com.aichat.service.impl;

import com.aichat.entity.Conversation;
import com.aichat.entity.Message;
import com.aichat.entity.ModelConfig;
import com.aichat.mapper.MessageMapper;
import com.aichat.service.ChatService;
import com.aichat.service.ConversationService;
import com.aichat.service.MessageService;
import com.aichat.service.ModelConfigService;
import com.aichat.service.provider.ChatModelProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;
import reactor.core.Disposable;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

    private final Map<String, ChatModelProvider> providers;
    private final ModelConfigService modelConfigService;
    private final ConversationService conversationService;
    private final MessageService messageService;
    private final MessageMapper messageMapper;

    public ChatServiceImpl(Map<String, ChatModelProvider> providers,
                           ModelConfigService modelConfigService,
                           ConversationService conversationService,
                           MessageService messageService,
                           MessageMapper messageMapper) {
        this.providers = providers;
        this.modelConfigService = modelConfigService;
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.messageMapper = messageMapper;
    }

    public SseEmitter stream(Long userId, Long conversationId, String content) {
        SseEmitter emitter = createEmitter(userId);

        Conversation conv = conversationService.getById(conversationId, userId);
        if (conv == null) {
            sendError(emitter, "Conversation not found");
            return emitter;
        }

        Message userMsg = new Message();
        userMsg.setConversationId(conversationId);
        userMsg.setRole("user");
        userMsg.setContent(content);
        messageMapper.insert(userMsg);

        streamAiResponse(emitter, userId, conv, content);
        return emitter;
    }

    public SseEmitter regenerate(Long userId, Long messageId) {
        SseEmitter emitter = createEmitter(userId);

        Message aiMsg = messageService.getById(messageId);
        if (aiMsg == null || !"assistant".equals(aiMsg.getRole())) {
            sendError(emitter, "消息不存在或无法重新生成");
            return emitter;
        }

        Conversation conv = conversationService.getById(aiMsg.getConversationId(), userId);
        if (conv == null) {
            sendError(emitter, "无权操作");
            return emitter;
        }

        Message userMsg = messageService.getPreviousUserMessage(aiMsg.getConversationId(), aiMsg.getId());
        if (userMsg == null) {
            sendError(emitter, "未找到对应的用户消息");
            return emitter;
        }

        // Delete all messages after the user message (clear old AI response and anything beyond)
        messageService.deleteAfter(aiMsg.getConversationId(), userMsg.getId());

        streamAiResponse(emitter, userId, conv, userMsg.getContent());
        return emitter;
    }

    private SseEmitter createEmitter(Long userId) {
        SseEmitter emitter = new SseEmitter(300_000L);
        emitter.onCompletion(() -> log.debug("SSE completed for userId={}", userId));
        emitter.onTimeout(() -> {
            log.warn("SSE timed out for userId={}", userId);
            sendEvent(emitter, "error", "请求超时，请重试");
            emitter.complete();
        });
        emitter.onError(ex -> log.error("SSE error for userId={}: {}", userId, ex.getMessage()));
        return emitter;
    }

    private void streamAiResponse(SseEmitter emitter, Long userId, Conversation conv, String userContent) {
        ModelConfig config = modelConfigService.getActive(userId);
        if (config == null) {
            sendEvent(emitter, "error", "请先在设置页面配置并激活模型");
            emitter.complete();
            return;
        }

        String providerKey = config.getProvider().toLowerCase();
        ChatModelProvider provider = providers.get(providerKey);
        if (provider == null) {
            sendEvent(emitter, "error", "不支持的供应商: " + config.getProvider());
            emitter.complete();
            return;
        }

        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();
        if (conv.getSystemPrompt() != null && !conv.getSystemPrompt().isBlank()) {
            messages.add(new SystemMessage(conv.getSystemPrompt()));
        }
        messages.add(new UserMessage(userContent));

        StringBuilder fullContent = new StringBuilder();
        StringBuilder fullThinking = new StringBuilder();

        try {
            AtomicReference<Disposable> disposableRef = new AtomicReference<>();
            Disposable disposable = provider.stream(new Prompt(messages), config).subscribe(
                    chunk -> {
                        ChatResponse response = (ChatResponse) chunk;
                        var metadata = response.getResult().getOutput().getMetadata();
                        if (metadata != null) {
                            Object reasoningObj = metadata.get("reasoningContent");
                            if (reasoningObj instanceof String reasoning && !reasoning.isBlank()) {
                                fullThinking.append(reasoning);
                                sendEvent(emitter, "thinking", reasoning);
                            }
                        }
                        String text = response.getResult().getOutput().getText();
                        if (text != null && !text.isBlank()) {
                            fullContent.append(text);
                            sendEvent(emitter, "message", text);
                        }
                    },
                    error -> {
                        log.error("Stream error: {}", error.getMessage(), error);
                        sendEvent(emitter, "error", error.getMessage());
                        emitter.complete();
                    },
                    () -> {
                        Message assistantMsg = new Message();
                        assistantMsg.setConversationId(conv.getId());
                        assistantMsg.setRole("assistant");
                        assistantMsg.setContent(fullContent.toString());
                        if (!fullThinking.isEmpty()) {
                            assistantMsg.setThinking(fullThinking.toString());
                        }
                        messageMapper.insert(assistantMsg);

                        sendEvent(emitter, "done", "");
                        emitter.complete();
                    }
            );
            disposableRef.set(disposable);
            emitter.onCompletion(() -> {
                if (disposableRef.get() != null && !disposableRef.get().isDisposed()) {
                    disposableRef.get().dispose();
                }
            });
        } catch (Exception e) {
            log.error("Stream setup error: {}", e.getMessage(), e);
            sendEvent(emitter, "error", e.getMessage());
            emitter.complete();
        }
    }

    private void sendError(SseEmitter emitter, String msg) {
        sendEvent(emitter, "error", msg);
        emitter.complete();
    }

    private void sendEvent(SseEmitter emitter, String name, String data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data));
        } catch (IOException ignored) {}
    }
}