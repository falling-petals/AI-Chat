package com.aichat.service;

import com.aichat.dto.MessageVO;
import com.aichat.entity.Message;

import java.util.List;

public interface MessageService {
    List<MessageVO> listByConversation(Long conversationId);
    Long save(Message message);
    Message getById(Long id);
    void update(Message message);
    void delete(Long id);
    void deleteAfter(Long conversationId, Long afterMessageId);
    Message getPreviousUserMessage(Long conversationId, Long messageId);
}
