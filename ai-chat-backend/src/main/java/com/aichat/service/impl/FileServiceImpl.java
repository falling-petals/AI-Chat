package com.aichat.service.impl;

import com.aichat.entity.File;
import com.aichat.mapper.FileMapper;
import com.aichat.service.FileService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class FileServiceImpl implements FileService {

    private final FileMapper fileMapper;

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    public FileServiceImpl(FileMapper fileMapper) {
        this.fileMapper = fileMapper;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("无法创建上传目录: " + uploadDir, e);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public File upload(Long userId, Long conversationId, String originalName, byte[] bytes, String mimeType) {
        String storedName = UUID.randomUUID().toString() + getExtension(originalName);
        Path targetPath = Paths.get(uploadDir, storedName);
        try {
            Files.write(targetPath, bytes);
        } catch (IOException e) {
            throw new RuntimeException("文件写入失败", e);
        }

        File file = new File();
        file.setUserId(userId);
        file.setConversationId(conversationId);
        file.setOriginalName(originalName);
        file.setStoredName(storedName);
        file.setMimeType(mimeType);
        file.setSize((long) bytes.length);
        fileMapper.insert(file);
        return file;
    }

    public File getById(Long id) {
        return fileMapper.selectById(id);
    }

    public List<File> getByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return Collections.emptyList();
        return fileMapper.selectBatchIds(ids);
    }

    public Resource loadAsResource(Long id) {
        File file = fileMapper.selectById(id);
        if (file == null) throw new RuntimeException("文件不存在");
        Path path = Paths.get(uploadDir, file.getStoredName());
        return new FileSystemResource(path.toFile());
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id, Long userId) {
        File file = fileMapper.selectById(id);
        if (file == null) return;
        if (!file.getUserId().equals(userId)) throw new RuntimeException("无权删除");
        try {
            Files.deleteIfExists(Paths.get(uploadDir, file.getStoredName()));
        } catch (IOException ignored) {}
        fileMapper.deleteById(id);
    }

    private String getExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        return idx == -1 ? "" : filename.substring(idx);
    }
}
