package com.aichat.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ModelConfigRequest {
    @NotBlank
    private String provider;
    @NotBlank
    private String modelName;
    @NotBlank
    private String apiKey;
    private String baseUrl;
}
