package com.aichat.service.impl;

import com.aichat.entity.Message;
import com.aichat.mapper.MessageMapper;
import com.aichat.service.MessageService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageMapper messageMapper;

    public MessageServiceImpl(MessageMapper messageMapper) {
        this.messageMapper = messageMapper;
    }

    public List<Message> listByConversation(Long conversationId) {
        return messageMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Message>()
                        .eq(Message::getConversationId, conversationId)
                        .orderByAsc(Message::getCreatedAt));
    }

    @Transactional(rollbackFor = Exception.class)
    public Long save(Message message) {
        messageMapper.insert(message);
        return message.getId();
    }
}
