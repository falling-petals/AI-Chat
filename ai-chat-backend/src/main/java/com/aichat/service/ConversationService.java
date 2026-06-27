package com.aichat.service;

import com.aichat.entity.Conversation;

import java.util.List;

public interface ConversationService {
    List<Conversation> listByUser(Long userId);
    Conversation getById(Long id, Long userId);
    Long create(Long userId, Conversation conversation);
    void update(Long userId, Conversation conversation);
    void delete(Long userId, Long id);
}
