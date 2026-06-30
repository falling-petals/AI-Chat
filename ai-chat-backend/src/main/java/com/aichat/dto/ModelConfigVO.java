package com.aichat.dto;

import com.aichat.entity.ModelConfig;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ModelConfigVO extends ModelConfig {
    private String maskedApiKey;
}
