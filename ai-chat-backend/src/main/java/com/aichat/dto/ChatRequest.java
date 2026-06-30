package com.aichat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChatRequest {
    private Long conversationId;
    @NotBlank(message="消息内容不能为空")
    @Size(max=50000, message="消息内容过长")
    private String content;
    private java.util.List<Long> fileIds;
    private Boolean searchEnabled;
    private String modelProvider;
    private String modelName;
}
