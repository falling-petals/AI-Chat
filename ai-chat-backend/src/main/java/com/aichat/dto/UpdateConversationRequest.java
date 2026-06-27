package com.aichat.dto;

import lombok.Data;

@Data
public class UpdateConversationRequest {
    private String title;
    private String systemPrompt;
}
