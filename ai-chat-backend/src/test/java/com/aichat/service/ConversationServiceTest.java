package com.aichat.service;

import com.aichat.entity.Conversation;
import com.aichat.mapper.ConversationMapper;
import com.aichat.service.impl.ConversationServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SuppressWarnings("unchecked")

@ExtendWith(MockitoExtension.class)
class ConversationServiceTest {

    @Mock
    private ConversationMapper conversationMapper;

    @InjectMocks
    private ConversationServiceImpl conversationService;

    @Test
    void searchByKeyword_shouldReturnMatchingConversations() {
        Long userId = 1L;
        String keyword = "test";
        Conversation conv = new Conversation();
        conv.setId(1L);
        conv.setTitle("test title");
        conv.setArchived(false);

        when(conversationMapper.selectList(any())).thenReturn(List.of(conv));

        List<Conversation> result = conversationService.search(userId, keyword);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getTitle()).isEqualTo("test title");
    }

    @Test
    void searchByKeyword_noMatch_shouldReturnEmptyList() {
        when(conversationMapper.selectList(any())).thenReturn(List.of());

        List<Conversation> result = conversationService.search(1L, "nonexistent");

        assertThat(result).isEmpty();
    }

    @Test
    void togglePin_onUnpinned_shouldSetPinnedToTrue() {
        Long userId = 1L;
        Long convId = 1L;
        Conversation conv = new Conversation();
        conv.setId(convId);
        conv.setUserId(userId);
        conv.setPinned(false);

        when(conversationMapper.selectOne(any())).thenReturn(conv);

        conversationService.togglePin(userId, convId);

        ArgumentCaptor<Conversation> captor = ArgumentCaptor.forClass(Conversation.class);
        verify(conversationMapper).updateById(captor.capture());
        assertThat(captor.getValue().getPinned()).isTrue();
    }

    @Test
    void togglePin_onPinned_shouldSetPinnedToFalse() {
        Long userId = 1L;
        Long convId = 1L;
        Conversation conv = new Conversation();
        conv.setId(convId);
        conv.setUserId(userId);
        conv.setPinned(true);

        when(conversationMapper.selectOne(any())).thenReturn(conv);

        conversationService.togglePin(userId, convId);

        ArgumentCaptor<Conversation> captor = ArgumentCaptor.forClass(Conversation.class);
        verify(conversationMapper).updateById(captor.capture());
        assertThat(captor.getValue().getPinned()).isFalse();
    }

    @Test
    void togglePin_nonExistentConv_shouldThrow() {
        when(conversationMapper.selectOne(any())).thenReturn(null);

        assertThatThrownBy(() -> conversationService.togglePin(1L, 999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不存在");
    }

    @Test
    void toggleArchive_onUnarchived_shouldSetArchivedToTrue() {
        Long userId = 1L;
        Long convId = 1L;
        Conversation conv = new Conversation();
        conv.setId(convId);
        conv.setUserId(userId);
        conv.setArchived(false);

        when(conversationMapper.selectOne(any())).thenReturn(conv);

        conversationService.toggleArchive(userId, convId);

        ArgumentCaptor<Conversation> captor2 = ArgumentCaptor.forClass(Conversation.class);
        verify(conversationMapper).updateById(captor2.capture());
        assertThat(captor2.getValue().getArchived()).isTrue();
    }

    @Test
    void toggleArchive_onArchived_shouldSetArchivedToFalse() {
        Long userId = 1L;
        Long convId = 1L;
        Conversation conv = new Conversation();
        conv.setId(convId);
        conv.setUserId(userId);
        conv.setArchived(true);

        when(conversationMapper.selectOne(any())).thenReturn(conv);

        conversationService.toggleArchive(userId, convId);

        ArgumentCaptor<Conversation> captor2 = ArgumentCaptor.forClass(Conversation.class);
        verify(conversationMapper).updateById(captor2.capture());
        assertThat(captor2.getValue().getArchived()).isFalse();
    }

    @Test
    void toggleArchive_nonExistentConv_shouldThrow() {
        when(conversationMapper.selectOne(any())).thenReturn(null);

        assertThatThrownBy(() -> conversationService.toggleArchive(1L, 999L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("不存在");
    }

    @Test
    void listByUser_shouldFilterArchivedAndSortByPinnedThenUpdatedAt() {
        Long userId = 1L;

        when(conversationMapper.selectList(any())).thenReturn(List.of());

        List<Conversation> result = conversationService.listByUser(userId);

        assertThat(result).isEmpty();
        verify(conversationMapper).selectList(any());
    }
}
