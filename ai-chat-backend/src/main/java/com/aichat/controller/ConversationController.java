package com.aichat.controller;

import com.aichat.common.Result;
import com.aichat.dto.CreateConversationRequest;
import com.aichat.dto.UpdateConversationRequest;
import com.aichat.entity.Conversation;
import com.aichat.service.ConversationService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public Result<List<Conversation>> list(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.success(conversationService.listByUser(userId));
    }

    @PostMapping
    public Result<Long> create(HttpServletRequest request, @RequestBody CreateConversationRequest req) {
        Long userId = (Long) request.getAttribute("userId");
        Conversation conv = new Conversation();
        conv.setTitle(req.getTitle());
        conv.setModelProvider(req.getModelProvider());
        conv.setModelName(req.getModelName());
        conv.setSystemPrompt(req.getSystemPrompt());
        Long id = conversationService.create(userId, conv);
        return Result.success(id);
    }

    @GetMapping("/{id}")
    public Result<Conversation> get(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.success(conversationService.getById(id, userId));
    }

    @PutMapping("/{id}")
    public Result<?> update(HttpServletRequest request, @PathVariable Long id, @RequestBody UpdateConversationRequest req) {
        Long userId = (Long) request.getAttribute("userId");
        Conversation conv = new Conversation();
        conv.setId(id);
        conv.setTitle(req.getTitle());
        conv.setSystemPrompt(req.getSystemPrompt());
        conversationService.update(userId, conv);
        return Result.success(null);
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        conversationService.delete(userId, id);
        return Result.success(null);
    }
}
