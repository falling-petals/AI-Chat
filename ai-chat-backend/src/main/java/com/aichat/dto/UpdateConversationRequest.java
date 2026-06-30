package com.aichat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateConversationRequest {
    @NotNull
    private Long id;
    private String title;
    private String systemPrompt;
}
