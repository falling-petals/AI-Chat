package com.aichat.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ModelConfig {
    private Long id;
    private Long userId;
    private String provider;
    private String modelName;
    private String apiKey;
    private String baseUrl;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
