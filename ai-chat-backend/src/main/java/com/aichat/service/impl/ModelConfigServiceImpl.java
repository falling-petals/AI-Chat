package com.aichat.service.impl;

import com.aichat.entity.ModelConfig;
import com.aichat.mapper.ModelConfigMapper;
import com.aichat.service.ModelConfigService;
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
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ModelConfig>()
                        .eq(ModelConfig::getUserId, userId)
                        .eq(ModelConfig::getProvider, provider)
                        .eq(ModelConfig::getModelName, modelName));
    }

    public List<ModelConfig> listByUser(Long userId) {
        return modelConfigMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ModelConfig>()
                        .eq(ModelConfig::getUserId, userId));
    }

    @Transactional(rollbackFor = Exception.class)
    public void save(Long userId, ModelConfig config) {
        config.setUserId(userId);
        modelConfigMapper.insert(config);
    }

    @Transactional(rollbackFor = Exception.class)
    public void update(Long userId, ModelConfig config) {
        config.setUserId(userId);
        modelConfigMapper.updateById(config);
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long userId, Long id) {
        modelConfigMapper.delete(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ModelConfig>()
                        .eq(ModelConfig::getId, id)
                        .eq(ModelConfig::getUserId, userId));
    }

    @Transactional(rollbackFor = Exception.class)
    public void activate(Long userId, Long id) {
        ModelConfig config = modelConfigMapper.selectById(id);
        if (config == null || !config.getUserId().equals(userId)) {
            throw new IllegalArgumentException("配置不存在或无权操作");
        }
        modelConfigMapper.update(null,
                new com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper<ModelConfig>()
                        .eq(ModelConfig::getUserId, userId)
                        .set(ModelConfig::getIsActive, false));
        config.setIsActive(true);
        modelConfigMapper.updateById(config);
    }

    public ModelConfig getActive(Long userId) {
        return modelConfigMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ModelConfig>()
                        .eq(ModelConfig::getUserId, userId)
                        .eq(ModelConfig::getIsActive, true));
    }
}
