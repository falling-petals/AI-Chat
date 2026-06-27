package com.aichat.service;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface ChatService {
    SseEmitter stream(Long userId, Long conversationId, String content);
}
