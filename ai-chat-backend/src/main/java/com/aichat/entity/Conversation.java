package com.aichat.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Conversation {
    private Long id;
    private Long userId;
    private String title;
    private String modelProvider;
    private String modelName;
    private String systemPrompt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
