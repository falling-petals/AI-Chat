package com.aichat.service.impl;

import com.aichat.dto.MessageVO;
import com.aichat.entity.Message;
import com.aichat.mapper.MessageMapper;
import com.aichat.service.FileService;
import com.aichat.service.MessageService;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MessageServiceImpl implements MessageService {

    private final MessageMapper messageMapper;
    private final FileService fileService;
    private final ObjectMapper objectMapper;

    public MessageServiceImpl(MessageMapper messageMapper, FileService fileService, ObjectMapper objectMapper) {
        this.messageMapper = messageMapper;
        this.fileService = fileService;
        this.objectMapper = objectMapper;
    }

    public List<MessageVO> listByConversation(Long conversationId) {
        List<Message> messages = messageMapper.selectList(
                new LambdaQueryWrapper<Message>()
                        .eq(Message::getConversationId, conversationId)
                        .orderByAsc(Message::getCreatedAt));
        return messages.stream().map(this::toMessageVO).collect(Collectors.toList());
    }

    private MessageVO toMessageVO(Message msg) {
        MessageVO vo = new MessageVO();
        vo.setId(msg.getId());
        vo.setConversationId(msg.getConversationId());
        vo.setRole(msg.getRole());
        vo.setContent(msg.getContent());
        vo.setThinking(msg.getThinking());
        vo.setFileIds(msg.getFileIds());
        vo.setCreatedAt(msg.getCreatedAt());
        vo.setDateLabel(computeDateLabel(msg.getCreatedAt()));
        if (msg.getFileIds() != null && !msg.getFileIds().isBlank()) {
            try {
                com.fasterxml.jackson.core.type.TypeReference<List<Long>> typeRef = new com.fasterxml.jackson.core.type.TypeReference<>() {};
                List<Long> ids = objectMapper.readValue(msg.getFileIds(), typeRef);
                vo.setFiles(fileService.getByIds(ids));
            } catch (Exception e) {
                vo.setFiles(java.util.Collections.emptyList());
            }
        } else {
            vo.setFiles(java.util.Collections.emptyList());
        }
        return vo;
    }

    private String computeDateLabel(LocalDateTime dateTime) {
        if (dateTime == null) return "更早";
        LocalDate today = LocalDate.now();
        LocalDate msgDate = dateTime.toLocalDate();

        if (msgDate.equals(today)) return "今天";
        if (msgDate.equals(today.minusDays(1))) return "昨天";

        LocalDate monday = today.with(java.time.DayOfWeek.MONDAY);
        if (!msgDate.isBefore(monday)) {
            String[] dayNames = {"", "周一", "周二", "周三", "周四", "周五", "周六", "周日"};
            return dayNames[msgDate.getDayOfWeek().getValue()];
        }

        return "更早";
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
                .gt(Message::getId, afterMessageId));
    }

    public Message getPreviousUserMessage(Long conversationId, Long messageId) {
        return messageMapper.getPreviousUserMessage(conversationId, messageId);
    }
}
