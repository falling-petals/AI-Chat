package com.aichat.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class User {
    private Long id;
    private String username;
    private String passwordHash;
    private String avatar;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
