package com.aichat.controller;

import com.aichat.common.Result;
import com.aichat.entity.File;
import com.aichat.service.FileService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    public Result<File> upload(HttpServletRequest request, @RequestParam("file") MultipartFile multipartFile) {
        Long userId = (Long) request.getAttribute("userId");
        if (multipartFile.isEmpty()) return Result.error(400, "文件为空");
        try {
            File file = fileService.upload(userId, null,
                    multipartFile.getOriginalFilename(),
                    multipartFile.getBytes(),
                    multipartFile.getContentType());
            return Result.success(file);
        } catch (IOException e) {
            return Result.error(500, "文件上传失败");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> serve(@PathVariable Long id) {
        File file = fileService.getById(id);
        if (file == null) return ResponseEntity.notFound().build();

        Resource resource = fileService.loadAsResource(id);
        String contentType = file.getMimeType() != null ? file.getMimeType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + file.getOriginalName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/{id}")
    public Result<?> delete(HttpServletRequest request, @PathVariable Long id) {
        Long userId = (Long) request.getAttribute("userId");
        try {
            fileService.delete(id, userId);
            return Result.success(null);
        } catch (RuntimeException e) {
            return Result.error(403, e.getMessage());
        }
    }
}
