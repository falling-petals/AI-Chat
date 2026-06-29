package com.aichat.service.impl;

import com.aichat.entity.Conversation;
import com.aichat.mapper.MessageMapper;
import com.aichat.service.ConversationService;
import com.aichat.service.FileService;
import com.aichat.service.MessageService;
import com.aichat.service.ModelConfigService;
import com.aichat.service.TavilyService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceImplTest {

    private ChatServiceImpl chatService;

    @Mock private ModelConfigService modelConfigService;
    @Mock private ConversationService conversationService;
    @Mock private MessageService messageService;
    @Mock private MessageMapper messageMapper;
    @Mock private FileService fileService;
    @Mock private TavilyService tavilyService;

    @BeforeEach
    void setUp() {
        chatService = new ChatServiceImpl(new HashMap<>(), modelConfigService, conversationService, messageService, messageMapper, fileService, tavilyService, new ObjectMapper(), "test-api-key");
    }

    @Test
    void autoRenameConversation_shouldUseFirstMessageAsTitle() {
        Long userId = 1L;
        Long convId = 1L;
        Conversation conv = new Conversation();
        conv.setId(convId);
        conv.setUserId(userId);
        conv.setTitle("");

        when(conversationService.getById(convId, userId)).thenReturn(conv);

        chatService.autoRenameConversation(userId, convId, "你好世界");

        ArgumentCaptor<Conversation> captor = ArgumentCaptor.forClass(Conversation.class);
        verify(conversationService).update(eq(userId), captor.capture());
        assertThat(captor.getValue().getTitle()).isEqualTo("你好世界");
    }

    @Test
    void autoRenameConversation_shouldTruncateLongMessage() {
        String longMsg = "这是一个非常长的消息，肯定超过三十个字符的限制了哈哈哈哈哈嗝咦咦咦";
        Conversation conv = new Conversation();
        conv.setId(1L); conv.setUserId(1L); conv.setTitle("");

        when(conversationService.getById(1L, 1L)).thenReturn(conv);

        chatService.autoRenameConversation(1L, 1L, longMsg);

        ArgumentCaptor<Conversation> captor = ArgumentCaptor.forClass(Conversation.class);
        verify(conversationService).update(eq(1L), captor.capture());
        String title = captor.getValue().getTitle();
        assertThat(title).endsWith("...");
        assertThat(title.length()).isEqualTo(33);
    }

    @Test
    void autoRenameConversation_titleExists_shouldNotUpdate() {
        Conversation conv = new Conversation();
        conv.setId(1L); conv.setUserId(1L); conv.setTitle("已有标题");

        when(conversationService.getById(1L, 1L)).thenReturn(conv);

        chatService.autoRenameConversation(1L, 1L, "Hello");

        verify(conversationService, never()).update(any(), any());
    }

    @Test
    void autoRenameConversation_blankContent_shouldNotUpdate() {
        chatService.autoRenameConversation(1L, 1L, "  ");

        verify(conversationService, never()).getById(any(), any());
    }
}
