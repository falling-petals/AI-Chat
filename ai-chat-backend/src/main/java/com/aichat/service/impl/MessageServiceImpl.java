package com.aichat.service.impl;

import com.aichat.entity.Message;
import com.aichat.mapper.MessageMapper;
import com.aichat.service.MessageService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
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
                new LambdaQueryWrapper<Message>()
                        .eq(Message::getConversationId, conversationId)
                        .orderByAsc(Message::getCreatedAt));
    }

    @Transactional(rollbackFor = Exception.class)
    public Long save(Message message) {
        messageMapper.insert(message);
        return message.getId();
    }

    public Message getById(Long id) {
        return messageMapper.selectById(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void update(Message message) {
        messageMapper.updateById(message);
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long id) {
        messageMapper.deleteById(id);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteAfter(Long conversationId, Long afterMessageId) {
        Message after = messageMapper.selectById(afterMessageId);
        if (after == null) return;
        messageMapper.delete(new LambdaQueryWrapper<Message>()
                .eq(Message::getConversationId, conversationId)
                .gt(Message::getCreatedAt, after.getCreatedAt()));
    }

    public Message getPreviousUserMessage(Long conversationId, Long messageId) {
        return messageMapper.getPreviousUserMessage(conversationId, messageId);
    }
}
