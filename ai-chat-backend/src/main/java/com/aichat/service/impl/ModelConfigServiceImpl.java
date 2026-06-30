package com.aichat.service.impl;

import com.aichat.entity.ModelConfig;
import com.aichat.mapper.ModelConfigMapper;
import com.aichat.service.ModelConfigService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ModelConfigServiceImpl implements ModelConfigService {

    private final ModelConfigMapper modelConfigMapper;

    public ModelConfigServiceImpl(ModelConfigMapper modelConfigMapper) {
        this.modelConfigMapper = modelConfigMapper;
    }

    public ModelConfig findByProviderAndModel(Long userId, String provider, String modelName) {
        return modelConfigMapper.selectOne(
                new LambdaQueryWrapper<ModelConfig>()
                        .eq(ModelConfig::getUserId, userId)
                        .eq(ModelConfig::getProvider, provider)
                        .eq(ModelConfig::getModelName, modelName));
    }

    public List<ModelConfig> listByUser(Long userId) {
        return modelConfigMapper.selectList(
                new LambdaQueryWrapper<ModelConfig>()
                        .eq(ModelConfig::getUserId, userId));
    }

    private static final String DASHSCOPE_COMPATIBLE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

    @Transactional(rollbackFor = Exception.class)
    public void save(Long userId, ModelConfig config) {
        config.setUserId(userId);
        if ("dashscope".equalsIgnoreCase(config.getProvider())
                && (config.getBaseUrl() == null || config.getBaseUrl().isBlank())) {
            config.setBaseUrl(DASHSCOPE_COMPATIBLE_URL);
        }
        modelConfigMapper.insert(config);
    }

    @Transactional(rollbackFor = Exception.class)
    public void update(Long userId, ModelConfig config) {
        ModelConfig existing = modelConfigMapper.selectById(config.getId());
        if (existing == null || !existing.getUserId().equals(userId)) {
            throw new IllegalArgumentException("配置不存在或无权修改");
        }
        config.setUserId(userId);
        modelConfigMapper.updateById(config);
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long userId, Long id) {
        modelConfigMapper.delete(
                new LambdaQueryWrapper<ModelConfig>()
                        .eq(ModelConfig::getId, id)
                        .eq(ModelConfig::getUserId, userId));
    }

}
