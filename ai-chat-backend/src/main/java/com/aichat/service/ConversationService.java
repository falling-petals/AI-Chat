package com.aichat.service;

import com.aichat.entity.Conversation;
import com.aichat.mapper.ConversationMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ConversationService {

    private final ConversationMapper conversationMapper;

    public ConversationService(ConversationMapper conversationMapper) {
        this.conversationMapper = conversationMapper;
    }

    public List<Conversation> listByUser(Long userId) {
        return conversationMapper.selectList(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Conversation>()
                        .eq(Conversation::getUserId, userId)
                        .orderByDesc(Conversation::getUpdatedAt));
    }

    public Conversation getById(Long id, Long userId) {
        return conversationMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Conversation>()
                        .eq(Conversation::getId, id)
                        .eq(Conversation::getUserId, userId));
    }

    @Transactional(rollbackFor = Exception.class)
    public Long create(Long userId, Conversation conversation) {
        conversation.setUserId(userId);
        conversationMapper.insert(conversation);
        return conversation.getId();
    }

    @Transactional(rollbackFor = Exception.class)
    public void update(Long userId, Conversation conversation) {
        Conversation existing = getById(conversation.getId(), userId);
        if (existing != null) {
            conversationMapper.updateById(conversation);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long userId, Long id) {
        conversationMapper.delete(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Conversation>()
                        .eq(Conversation::getId, id)
                        .eq(Conversation::getUserId, userId));
    }
}
