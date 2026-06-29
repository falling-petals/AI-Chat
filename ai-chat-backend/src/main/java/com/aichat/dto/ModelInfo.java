package com.aichat.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ModelInfo {
    private String provider;
    private String modelName;
    @JsonProperty("isDefault")
    private boolean isDefault;
    private Long configId;
}
