package com.aichat.controller;

import com.aichat.common.Result;
import com.aichat.entity.ModelConfig;
import com.aichat.service.ModelConfigService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/model-configs")
public class ModelConfigController {

    private final ModelConfigService modelConfigService;

    public ModelConfigController(ModelConfigService modelConfigService) {
        this.modelConfigService = modelConfigService;
    }

    @GetMapping
    public Result<List<ModelConfig>> list(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        return Result.success(modelConfigService.listByUser(userId));
    }

    @PostMapping
    public Result<?> save(HttpServletRequest request, @RequestBody ModelConfig config) {
        Long userId = (Long) request.getAttribute("userId");
        modelConfigService.save(userId, config);
        return Result.success(null);
    }

    @PutMapping("/{id}")
    public Result<?> update(HttpServletRequest request, @PathVariable Long id, @RequestBody ModelConfig config) {
        Long userId = (Long) request.getAttribute("userId");
        config.setId(id);
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
