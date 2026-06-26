package com.aichat.service;

import com.aichat.entity.Message;
import com.aichat.mapper.MessageMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MessageService {

    private final MessageMapper messageMapper;

    public MessageService(MessageMapper messageMapper) {
        this.messageMapper = messageMapper;
    }

    public List<Message> listByConversation(Long conversationId) {
        return messageMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Message>()
                        .eq(Message::getConversationId, conversationId)
                        .orderByAsc(Message::getCreatedAt));
    }

    public Long save(Message message) {
        messageMapper.insert(message);
        return message.getId();
    }
}
