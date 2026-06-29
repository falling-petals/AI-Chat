package com.aichat.service;

import com.aichat.entity.ModelConfig;

import java.util.List;

public interface ModelConfigService {
    List<ModelConfig> listByUser(Long userId);
    ModelConfig findByProviderAndModel(Long userId, String provider, String modelName);
    void save(Long userId, ModelConfig config);
    void update(Long userId, ModelConfig config);
    void delete(Long userId, Long id);
    void activate(Long userId, Long id);
    ModelConfig getActive(Long userId);
}
