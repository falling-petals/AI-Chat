package com.aichat.controller;

import com.aichat.common.Result;
import com.aichat.dto.ChatRequest;
import com.aichat.dto.MessageVO;
import com.aichat.dto.ModelInfo;
import com.aichat.dto.UpdateMessageRequest;
import com.aichat.entity.Message;
import com.aichat.entity.ModelConfig;
import com.aichat.service.ChatService;
import com.aichat.service.ConversationService;
import com.aichat.service.MessageService;
import com.aichat.service.ModelConfigService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final MessageService messageService;
    private final ConversationService conversationService;
    private final ModelConfigService modelConfigService;

    @Value("${app.default-model.provider:}")
    private String defaultModelProvider;

    @Value("${app.default-model.model-name:}")
    private String defaultModelName;

    public ChatController(ChatService chatService, MessageService messageService,
                          ConversationService conversationService, ModelConfigService modelConfigService) {
        this.chatService = chatService;
        this.messageService = messageService;
        this.conversationService = conversationService;
        this.modelConfigService = modelConfigService;
    }

    @GetMapping("/models/available")
    public Result<List<ModelInfo>> getAvailableModels(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<ModelInfo> list = new ArrayList<>();
        if (!defaultModelProvider.isBlank() && !defaultModelName.isBlank()) {
            list.add(new ModelInfo(defaultModelProvider, defaultModelName, true, null));
        }
        List<ModelConfig> userConfigs = modelConfigService.listByUser(userId);
        for (ModelConfig c : userConfigs) {
            list.add(new ModelInfo(c.getProvider(), c.getModelName(), false, c.getId()));
        }
        return Result.success(list);
    }

    @PostMapping("/stream")
    public SseEmitter stream(HttpServletRequest request, @RequestBody ChatRequest chatRequest) {
        Long userId = (Long) request.getAttribute("userId");
        return chatService.stream(userId, chatRequest.getConversationId(), chatRequest.getContent(), chatRequest.getFileIds(), chatRequest.getSearchEnabled(), chatRequest.getModelProvider(), chatRequest.getModelName());
    }

    @GetMapping("/messages/{conversationId}")
    public Result<List<MessageVO>> messages(HttpServletRequest request, @PathVariable Long conversationId) {
        Long userId = (Long) request.getAttribute("userId");
        if (!isOwner(userId, conversationId)) return Result.error(403, "无权操作");
        return Result.success(messageService.listByConversation(conversationId));
    }

    @PutMapping("/messages/{id}")
    public Result<?> updateMessage(HttpServletRequest request, @PathVariable Long id,
                                   @RequestBody UpdateMessageRequest body) {
        Long userId = (Long) request.getAttribute("userId");
        Message msg = messageService.getById(id);
        if (msg == null) return Result.error(404, "消息不存在");
        if (!isOwner(userId, msg.getConversationId())) return Result.error(403, "无权操作");
        msg.setContent(body.getContent());
        messageService.update(msg);
        return Result.success(null);
    }

    @DeleteMapping("/messages/{id}")
    public Result<?> deleteMessage(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        Message msg = messageService.getById(id);
        if (msg == null) return Result.error(404, "消息不存在");
        if (!isOwner(userId, msg.getConversationId())) return Result.error(403, "无权操作");
        messageService.delete(id);
        return Result.success(null);
    }

    @PostMapping("/messages/{id}/regenerate")
    public SseEmitter regenerate(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        return chatService.regenerate(userId, id);
    }

    private boolean isOwner(Long userId, Long conversationId) {
        return conversationService.getById(conversationId, userId) != null;
    }
}
