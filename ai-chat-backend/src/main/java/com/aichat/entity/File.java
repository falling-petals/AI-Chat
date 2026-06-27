package com.aichat.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class File {
    private Long id;
    @JsonIgnore
    private Long userId;
    @JsonIgnore
    private Long conversationId;
    private String originalName;
    @JsonIgnore
    private String storedName;
    private String mimeType;
    private Long size;
    private LocalDateTime createdAt;
}
