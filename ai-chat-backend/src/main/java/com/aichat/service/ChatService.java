package com.aichat.service;

import com.aichat.entity.Conversation;
import com.aichat.entity.Message;
import com.aichat.entity.ModelConfig;
import com.aichat.mapper.MessageMapper;
import com.alibaba.cloud.ai.dashscope.api.DashScopeApi;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatOptions;
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

        ModelConfig config = modelConfigService.getActive(userId);
        if (config == null) {
            sendEvent(emitter, "error", "请先在设置页面配置并激活模型");
            emitter.complete();
            return emitter;
        }

        Conversation conv = conversationService.getById(conversationId, userId);
        if (conv == null) {
            sendEvent(emitter, "error", "Conversation not found");
            emitter.complete();
            return emitter;
        }

        Message userMsg = new Message();
        userMsg.setConversationId(conversationId);
        userMsg.setRole("user");
        userMsg.setContent(content);
        messageMapper.insert(userMsg);

        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();
        if (conv.getSystemPrompt() != null && !conv.getSystemPrompt().isBlank()) {
            messages.add(new org.springframework.ai.chat.messages.SystemMessage(conv.getSystemPrompt()));
        }
        messages.add(new UserMessage(content));

        DashScopeApi userApi = DashScopeApi.builder()
                .apiKey(config.getApiKey())
                .baseUrl(config.getBaseUrl())
                .build();

        DashScopeChatOptions userOptions = DashScopeChatOptions.builder()
                .withModel(config.getModelName())
                .build();

        DashScopeChatModel userModel = defaultChatModel.mutate()
                .dashScopeApi(userApi)
                .defaultOptions(userOptions)
                .build();

        StringBuilder fullContent = new StringBuilder();

        try {
            userModel.stream(new Prompt(messages)).subscribe(
                    chunk -> {
                        ChatResponse response = (ChatResponse) chunk;
                        String text = response.getResult().getOutput().getText();
                        if (text != null) {
                            fullContent.append(text);
                            sendEvent(emitter, "message", text);
                        }
                    },
                    error -> {
                        sendEvent(emitter, "error", error.getMessage());
                        emitter.complete();
                    },
                    () -> {
                        Message assistantMsg = new Message();
                        assistantMsg.setConversationId(conversationId);
                        assistantMsg.setRole("assistant");
                        assistantMsg.setContent(fullContent.toString());
                        messageMapper.insert(assistantMsg);

                        sendEvent(emitter, "done", "");
                        emitter.complete();
                    }
            );
        } catch (Exception e) {
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
