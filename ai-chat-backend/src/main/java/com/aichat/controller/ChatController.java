package com.aichat.controller;

import com.aichat.dto.ChatRequest;
import com.aichat.service.ChatService;
import com.aichat.service.MessageService;
import com.aichat.entity.Message;
import com.aichat.common.Result;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final MessageService messageService;

    public ChatController(ChatService chatService, MessageService messageService) {
        this.chatService = chatService;
        this.messageService = messageService;
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
}
