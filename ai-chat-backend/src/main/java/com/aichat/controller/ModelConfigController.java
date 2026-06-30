package com.aichat.controller;

import com.aichat.common.Result;
import com.aichat.dto.ModelConfigRequest;
import com.aichat.dto.ModelConfigVO;
import com.aichat.entity.ModelConfig;
import com.aichat.service.ModelConfigService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/model-configs")
public class ModelConfigController {

    private final ModelConfigService modelConfigService;

    public ModelConfigController(ModelConfigService modelConfigService) {
        this.modelConfigService = modelConfigService;
    }

    @GetMapping
    public Result<List<ModelConfigVO>> list(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<ModelConfig> configs = modelConfigService.listByUser(userId);
        List<ModelConfigVO> vos = configs.stream().map(config -> {
            ModelConfigVO vo = new ModelConfigVO();
            BeanUtils.copyProperties(config, vo);
            vo.setMaskedApiKey(maskApiKey(config.getApiKey()));
            return vo;
        }).collect(Collectors.toList());
        return Result.success(vos);
    }

    private String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.length() < 8) return "****";
        return apiKey.substring(0, 3) + "****" + apiKey.substring(apiKey.length() - 4);
    }

    @PostMapping
    public Result<?> save(HttpServletRequest request, @RequestBody @Valid ModelConfigRequest req) {
        Long userId = (Long) request.getAttribute("userId");
        ModelConfig config = new ModelConfig();
        config.setProvider(req.getProvider());
        config.setModelName(req.getModelName());
        config.setApiKey(req.getApiKey());
        config.setBaseUrl(req.getBaseUrl());
        modelConfigService.save(userId, config);
        return Result.success(null);
    }

    @PutMapping("/{id}")
    public Result<?> update(HttpServletRequest request, @PathVariable Long id, @RequestBody @Valid ModelConfigRequest req) {
        Long userId = (Long) request.getAttribute("userId");
        ModelConfig config = new ModelConfig();
        config.setId(id);
        config.setProvider(req.getProvider());
        config.setModelName(req.getModelName());
        config.setApiKey(req.getApiKey());
        config.setBaseUrl(req.getBaseUrl());
        modelConfigService.update(userId, config);
        return Result.success(null);
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        modelConfigService.delete(userId, id);
        return Result.success(null);
    }
}
