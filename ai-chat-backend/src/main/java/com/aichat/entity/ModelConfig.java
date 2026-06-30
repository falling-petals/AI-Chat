package com.aichat.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ModelConfig {
    private Long id;
    private Long userId;
    private String provider;
    private String modelName;
    @JsonIgnore
    private String apiKey;
    private String baseUrl;
    private LocalDateTime createdAt;
}
