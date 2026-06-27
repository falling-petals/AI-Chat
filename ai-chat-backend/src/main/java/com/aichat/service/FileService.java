package com.aichat.service;

import com.aichat.entity.File;
import org.springframework.core.io.Resource;

import java.util.List;

public interface FileService {
    File upload(Long userId, Long conversationId, String originalName, byte[] bytes, String mimeType);
    File getById(Long id);
    List<File> getByIds(List<Long> ids);
    Resource loadAsResource(Long id);
    void delete(Long id, Long userId);
}
