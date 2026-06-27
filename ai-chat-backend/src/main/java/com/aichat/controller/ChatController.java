package com.aichat.controller;

import com.aichat.common.Result;
import com.aichat.dto.ChatRequest;
import com.aichat.dto.UpdateMessageRequest;
import com.aichat.entity.Message;
import com.aichat.service.ChatService;
import com.aichat.service.ConversationService;
import com.aichat.service.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final MessageService messageService;
    private final ConversationService conversationService;

    public ChatController(ChatService chatService, MessageService messageService,
                          ConversationService conversationService) {
        this.chatService = chatService;
        this.messageService = messageService;
        this.conversationService = conversationService;
    }

    @PostMapping("/stream")
    public SseEmitter stream(HttpServletRequest request, @RequestBody ChatRequest chatRequest) {
        Long userId = (Long) request.getAttribute("userId");
        return chatService.stream(userId, chatRequest.getConversationId(), chatRequest.getContent());
    }

    @GetMapping("/messages/{conversationId}")
    public Result<List<Message>> messages(@PathVariable Long conversationId) {
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
