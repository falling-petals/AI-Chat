package com.aichat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ModelInfo {
    private String provider;
    private String modelName;
    private boolean isDefault;
    private Long configId;
}
