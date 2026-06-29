package com.aichat.service.impl;

import com.aichat.entity.Conversation;
import com.aichat.mapper.ConversationMapper;
import com.aichat.service.ConversationService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ConversationServiceImpl implements ConversationService {

    private final ConversationMapper conversationMapper;

    public ConversationServiceImpl(ConversationMapper conversationMapper) {
        this.conversationMapper = conversationMapper;
    }

    public List<Conversation> listByUser(Long userId) {
        return conversationMapper.selectList(
                new LambdaQueryWrapper<Conversation>()
                        .eq(Conversation::getUserId, userId)
                        .orderByDesc(Conversation::getPinned)
                        .orderByDesc(Conversation::getUpdatedAt));
    }

    public Conversation getById(Long id, Long userId) {
        return conversationMapper.selectOne(
                new LambdaQueryWrapper<Conversation>()
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
    public void touch(Long userId, Long id) {
        Conversation existing = getById(id, userId);
        if (existing != null) {
            existing.setUpdatedAt(LocalDateTime.now());
            conversationMapper.updateById(existing);
        }
    }

    @Transactional(rollbackFor = Exception.class)
    public void delete(Long userId, Long id) {
        conversationMapper.delete(
                new LambdaQueryWrapper<Conversation>()
                        .eq(Conversation::getId, id)
                        .eq(Conversation::getUserId, userId));
    }

    public List<Conversation> search(Long userId, String keyword) {
        return conversationMapper.selectList(
                new LambdaQueryWrapper<Conversation>()
                        .eq(Conversation::getUserId, userId)
                        .like(keyword != null && !keyword.isBlank(),
                                Conversation::getTitle, keyword)
                        .orderByDesc(Conversation::getPinned)
                        .orderByDesc(Conversation::getUpdatedAt));
    }

    @Transactional(rollbackFor = Exception.class)
    public void togglePin(Long userId, Long id) {
        Conversation existing = getById(id, userId);
        if (existing == null) {
            throw new IllegalArgumentException("会话不存在或无权访问");
        }
        existing.setPinned(!Boolean.TRUE.equals(existing.getPinned()));
        conversationMapper.updateById(existing);
    }

    @Transactional(rollbackFor = Exception.class)
    public void toggleArchive(Long userId, Long id) {
        Conversation existing = getById(id, userId);
        if (existing == null) {
            throw new IllegalArgumentException("会话不存在或无权访问");
        }
        existing.setArchived(!Boolean.TRUE.equals(existing.getArchived()));
        conversationMapper.updateById(existing);
    }
}
