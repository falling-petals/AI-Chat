package com.aichat.service;

import com.aichat.entity.Message;

import java.util.List;

public interface MessageService {
    List<Message> listByConversation(Long conversationId);
    Long save(Message message);
}
