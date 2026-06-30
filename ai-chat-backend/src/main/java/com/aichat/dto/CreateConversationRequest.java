package com.aichat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateConversationRequest {
    @NotNull
    private String title;
    private String systemPrompt;
}
