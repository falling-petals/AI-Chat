package com.aichat.service;

import com.aichat.entity.ModelConfig;
import com.aichat.mapper.ModelConfigMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ModelConfigService {

    private final ModelConfigMapper modelConfigMapper;

    public ModelConfigService(ModelConfigMapper modelConfigMapper) {
        this.modelConfigMapper = modelConfigMapper;
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

    public ModelConfig getActive(Long userId) {
        return modelConfigMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<ModelConfig>()
                        .eq(ModelConfig::getUserId, userId)
                        .eq(ModelConfig::getIsActive, true));
    }
}
