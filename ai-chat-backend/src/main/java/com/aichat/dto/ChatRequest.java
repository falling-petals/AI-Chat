package com.aichat.dto;

import lombok.Data;

@Data
public class ChatRequest {
    private Long conversationId;
    private String content;
    private java.util.List<Long> fileIds;
    private Boolean searchEnabled;
}
