package com.aichat.service;

import com.aichat.entity.Conversation;

import java.util.List;

public interface ConversationService {
    List<Conversation> listByUser(Long userId);
    Conversation getById(Long id, Long userId);
    Long create(Long userId, Conversation conversation);
    void update(Long userId, Conversation conversation);
    void touch(Long userId, Long id);
    void delete(Long userId, Long id);
    List<Conversation> search(Long userId, String keyword);
    void togglePin(Long userId, Long id);
    void toggleArchive(Long userId, Long id);
}
