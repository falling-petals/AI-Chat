package com.aichat.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private Long conversationId;
    private String content;
}
