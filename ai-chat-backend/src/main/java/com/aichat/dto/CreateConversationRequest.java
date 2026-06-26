package com.aichat.dto;

import lombok.Data;

@Data
public class CreateConversationRequest {
    private String title;
    private String modelProvider;
    private String modelName;
    private String systemPrompt;
}
