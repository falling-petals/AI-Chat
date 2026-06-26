package com.aichat.service;

import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatModel;
import com.aichat.entity.ModelConfig;
import com.aichat.mapper.MessageMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private DashScopeChatModel defaultChatModel;

    @Mock
    private ModelConfigService modelConfigService;

    @Mock
    private ConversationService conversationService;

    @Mock
    private MessageMapper messageMapper;

    @InjectMocks
    private ChatService chatService;

    @Test
    void streamShouldStopEarlyWhenProviderIsUnsupported() {
        ModelConfig config = new ModelConfig();
        config.setProvider("openai");
        config.setModelName("gpt-4o-mini");
        config.setApiKey("test-key");

        when(modelConfigService.getActive(1L)).thenReturn(config);

        chatService.stream(1L, 2L, "hello");

        verifyNoInteractions(conversationService, messageMapper, defaultChatModel);
    }
}
