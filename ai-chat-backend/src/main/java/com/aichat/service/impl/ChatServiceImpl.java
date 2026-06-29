package com.aichat.service.impl;

import com.aichat.entity.Conversation;
import com.aichat.entity.Message;
import com.aichat.entity.ModelConfig;
import com.aichat.mapper.MessageMapper;
import com.aichat.service.ChatService;
import com.aichat.service.ConversationService;
import com.aichat.service.MessageService;
import com.aichat.service.ModelConfigService;
import com.aichat.service.TavilyService;
import com.aichat.dto.SearchResult;
import com.aichat.service.provider.ChatModelProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import com.aichat.service.FileService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import reactor.core.Disposable;
import org.apache.tika.Tika;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

    private static final Tika TIKA = new Tika();

    private final Map<String, ChatModelProvider> providers;
    private final ModelConfigService modelConfigService;
    private final ConversationService conversationService;
    private final MessageService messageService;
    private final MessageMapper messageMapper;
    private final FileService fileService;
    private final TavilyService tavilyService;
    private final ObjectMapper objectMapper;

    @Value("${app.file-extract-max-chars:50000}")
    private int maxExtractChars;

    @Value("${app.chat-context-size:30}")
    private int chatContextSize;

    @Value("${app.upload-dir:./uploads}")
    private String uploadDir;

    @Value("${app.default-model.provider:}")
    private String defaultModelProvider;

    @Value("${app.default-model.model-name:}")
    private String defaultModelName;

    private ModelConfig buildDefaultModelConfig() {
        if (defaultModelProvider.isBlank() || defaultModelName.isBlank()) return null;
        ModelConfig config = new ModelConfig();
        config.setProvider(defaultModelProvider);
        config.setModelName(defaultModelName);
        config.setApiKey(dashscopeApiKey);
        return config;
    }

    private String dashscopeApiKey;

    public ChatServiceImpl(Map<String, ChatModelProvider> providers,
                            ModelConfigService modelConfigService,
                            ConversationService conversationService,
                            MessageService messageService,
                            MessageMapper messageMapper,
                            FileService fileService,
                            TavilyService tavilyService,
                            ObjectMapper objectMapper,
                            @Value("${spring.ai.dashscope.api-key}") String dashscopeApiKey) {
        this.providers = providers;
        this.modelConfigService = modelConfigService;
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.messageMapper = messageMapper;
        this.fileService = fileService;
        this.tavilyService = tavilyService;
        this.objectMapper = objectMapper;
        this.dashscopeApiKey = dashscopeApiKey;
    }

    private ModelConfig resolveModelConfig(Long userId, String modelProvider, String modelName) {
        // 1. 如果请求指定了模型，优先使用
        if (modelProvider != null && modelName != null) {
            ModelConfig userConfig = modelConfigService.findByProviderAndModel(userId, modelProvider, modelName);
            if (userConfig != null) return userConfig;
            // 如果匹配默认模型则用默认
            if (modelProvider.equals(defaultModelProvider) && modelName.equals(defaultModelName)) {
                ModelConfig dc = buildDefaultModelConfig();
                if (dc != null) return dc;
            }
        }
        // 2. 回退到默认模型
        ModelConfig dc = buildDefaultModelConfig();
        if (dc != null) return dc;
        return null;
    }

    public SseEmitter stream(Long userId, Long conversationId, String content, List<Long> fileIds, Boolean searchEnabled, String modelProvider, String modelName) {
        SseEmitter emitter = createEmitter(userId);
        try {
            Conversation conv = conversationService.getById(conversationId, userId);
            if (conv == null) {
                sendError(emitter, "Conversation not found");
                return emitter;
            }

            Message userMsg = new Message();
            userMsg.setConversationId(conversationId);
            userMsg.setRole("user");
            userMsg.setContent(content);
            if (fileIds != null && !fileIds.isEmpty()) {
                try {
                    userMsg.setFileIds(objectMapper.writeValueAsString(fileIds));
                } catch (JsonProcessingException ignored) {}
            }
            userMsg.setSearchEnabled(searchEnabled != null && searchEnabled);
            userMsg.setCreatedAt(LocalDateTime.now());
            messageMapper.insert(userMsg);

            conv.setUpdatedAt(LocalDateTime.now());
            conversationService.update(userId, conv);

            streamAiResponse(emitter, userId, conv, content, fileIds, searchEnabled != null && searchEnabled, userMsg.getCreatedAt(), modelProvider, modelName);
            return emitter;
        } catch (Exception e) {
            log.error("Stream setup error for userId={}", userId, e);
            sendError(emitter, "服务器内部错误");
            return emitter;
        }
    }

    public SseEmitter regenerate(Long userId, Long messageId) {
        SseEmitter emitter = createEmitter(userId);
        try {
            Message aiMsg = messageService.getById(messageId);
            if (aiMsg == null || !"assistant".equals(aiMsg.getRole())) {
                sendError(emitter, "消息不存在或无法重新生成");
                return emitter;
            }

            Conversation conv = conversationService.getById(aiMsg.getConversationId(), userId);
            if (conv == null) {
                sendError(emitter, "无权操作");
                return emitter;
            }

            Message userMsg = messageService.getPreviousUserMessage(aiMsg.getConversationId(), aiMsg.getId());
            if (userMsg == null) {
                sendError(emitter, "未找到对应的用户消息");
                return emitter;
            }

            // Delete all messages after the user message (clear old AI response and anything beyond)
            messageService.deleteAfter(aiMsg.getConversationId(), userMsg.getId());

            conv.setUpdatedAt(LocalDateTime.now());
            conversationService.update(userId, conv);

            // Parse fileIds from the stored user message for regenerate
            List<Long> fileIds = new ArrayList<>();
            if (userMsg.getFileIds() != null && !userMsg.getFileIds().isBlank()) {
                try {
                    fileIds = objectMapper.readValue(userMsg.getFileIds(),
                            new com.fasterxml.jackson.core.type.TypeReference<List<Long>>() {});
                } catch (Exception ignored) {}
            }

            boolean hadSearch = Boolean.TRUE.equals(userMsg.getSearchEnabled());
            streamAiResponse(emitter, userId, conv, userMsg.getContent(), fileIds, hadSearch, userMsg.getCreatedAt(), null, null);
            return emitter;
        } catch (Exception e) {
            log.error("Regenerate setup error for userId={}", userId, e);
            sendError(emitter, "服务器内部错误");
            return emitter;
        }
    }

    private SseEmitter createEmitter(Long userId) {
        SseEmitter emitter = new SseEmitter(300_000L);
        emitter.onCompletion(() -> log.debug("SSE completed for userId={}", userId));
        emitter.onTimeout(() -> {
            log.warn("SSE timed out for userId={}", userId);
            sendEvent(emitter, "error", "请求超时，请重试");
            emitter.complete();
        });
        emitter.onError(ex -> log.error("SSE error for userId={}: {}", userId, ex.getMessage()));
        return emitter;
    }

    private void streamAiResponse(SseEmitter emitter, Long userId, Conversation conv, String userContent, List<Long> fileIds, boolean searchEnabled, LocalDateTime before, String modelProvider, String modelName) {
        ModelConfig config = resolveModelConfig(userId, modelProvider, modelName);
        if (config == null) {
            sendEvent(emitter, "error", "请先在设置页面配置并激活模型");
            emitter.complete();
            return;
        }

        String providerKey = config.getProvider().toLowerCase();
        ChatModelProvider provider = providers.get(providerKey);
        if (provider == null) {
            sendEvent(emitter, "error", "不支持的供应商: " + config.getProvider());
            emitter.complete();
            return;
        }

        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();

        // 合并所有系统级内容为一个 SystemMessage
        StringBuilder systemBuilder = new StringBuilder();
        if (conv.getSystemPrompt() != null && !conv.getSystemPrompt().isBlank()) {
            systemBuilder.append(conv.getSystemPrompt()).append("\n\n");
        }

        final List<SearchResult> searchResults;
        if (searchEnabled) {
            searchResults = tavilyService.search(userContent);
            if (!searchResults.isEmpty()) {
                systemBuilder.append("以下是来自互联网搜索的相关信息，请参考这些信息来回答用户问题：\n\n");
                for (int i = 0; i < searchResults.size(); i++) {
                    SearchResult r = searchResults.get(i);
                    systemBuilder.append("[").append(i + 1).append("] ").append(r.getTitle()).append("\n");
                    systemBuilder.append("    来源: ").append(r.getUrl()).append("\n");
                    systemBuilder.append("    内容: ").append(r.getContent()).append("\n\n");
                }
            }
        } else {
            searchResults = List.of();
        }

        Set<Long> extractedFileIds = new HashSet<>();
        if (fileIds != null && !fileIds.isEmpty()) {
            List<com.aichat.entity.File> fileEntities = fileService.getByIds(fileIds);
            for (com.aichat.entity.File f : fileEntities) {
                String extracted = extractTextContent(f);
                if (extracted != null) {
                    systemBuilder.append("用户上传了文档「").append(f.getOriginalName()).append("」，其文本内容如下：\n\n");
                    systemBuilder.append(extracted).append("\n\n");
                    extractedFileIds.add(f.getId());
                }
            }
        }

        if (!systemBuilder.isEmpty()) {
            messages.add(new SystemMessage(systemBuilder.toString().strip()));
        }

        // Load recent conversation history (exclude current message by `before` timestamp)
        List<com.aichat.entity.Message> historyMsgs = messageMapper.selectRecentContextMessages(
                conv.getId(), before, chatContextSize);
        if (!historyMsgs.isEmpty()) {
            Collections.reverse(historyMsgs);
            for (com.aichat.entity.Message hMsg : historyMsgs) {
                if ("user".equals(hMsg.getRole())) {
                    List<Long> hFileIds = new ArrayList<>();
                    if (hMsg.getFileIds() != null && !hMsg.getFileIds().isBlank()) {
                        try {
                            hFileIds = objectMapper.readValue(hMsg.getFileIds(),
                                    new com.fasterxml.jackson.core.type.TypeReference<List<Long>>() {});
                        } catch (Exception ignored) {}
                    }
                    messages.add(buildUserMessage(hMsg.getContent() != null ? hMsg.getContent() : "", hFileIds, Set.of()));
                } else if ("assistant".equals(hMsg.getRole())) {
                    messages.add(new AssistantMessage(
                            hMsg.getContent() != null ? hMsg.getContent() : ""));
                }
            }
        }
        messages.add(buildUserMessage(userContent, fileIds, extractedFileIds));

        StringBuffer fullContent = new StringBuffer();
        StringBuffer fullThinking = new StringBuffer();

        AtomicReference<Disposable> disposableRef = new AtomicReference<>();
        AtomicBoolean savedToDb = new AtomicBoolean(false);

        emitter.onCompletion(() -> {
            log.debug("SSE onCompletion for userId={}", userId);
            String partialContent = fullContent.toString();
            String partialThinking = fullThinking.toString();
            if (!partialContent.isBlank() || !partialThinking.isBlank()) {
                    if (!savedToDb.getAndSet(true)) {
                        Message assistantMsg = new Message();
                        assistantMsg.setConversationId(conv.getId());
                        assistantMsg.setRole("assistant");
                        assistantMsg.setContent(partialContent);
                        if (!partialThinking.isBlank()) {
                            assistantMsg.setThinking(partialThinking);
                        }
                        messageMapper.insert(assistantMsg);
                        conversationService.touch(userId, conv.getId());
                        log.debug("停止生成，已保存部分 AI 回复 ({} 字符)", partialContent.length());
                    }
            }
        });

        if (conv.getTitle() == null || conv.getTitle().isBlank()) {
            autoRenameConversation(userId, conv.getId(), userContent);
        }

        try {
            Disposable disposable = provider.stream(new Prompt(messages), config).subscribe(
                    chunk -> {
                        ChatResponse response = (ChatResponse) chunk;
                        var result = response.getResult();
                        var output = result != null ? result.getOutput() : null;
                        if (output == null) return;

                        var metadata = output.getMetadata();
                        if (metadata != null) {
                            Object reasoningObj = metadata.get("reasoningContent");
                            if (reasoningObj instanceof String reasoning && !reasoning.isBlank()) {
                                fullThinking.append(reasoning);
                                sendEvent(emitter, "thinking", reasoning);
                            }
                        }
                        String text = output.getText();
                        if (text != null && !text.isBlank()) {
                            fullContent.append(text);
                            sendEvent(emitter, "message", text);
                        }
                    },
                    error -> {
                        log.error("Stream error: {}", error.getMessage(), error);
                        String partialContent = fullContent.toString();
                        String partialThinking = fullThinking.toString();
                        if (!partialContent.isBlank() || !partialThinking.isBlank()) {
                            if (!savedToDb.getAndSet(true)) {
                                Message assistantMsg = new Message();
                                assistantMsg.setConversationId(conv.getId());
                                assistantMsg.setRole("assistant");
                                assistantMsg.setContent(partialContent);
                                if (!partialThinking.isBlank()) {
                                    assistantMsg.setThinking(partialThinking);
                                }
                                messageMapper.insert(assistantMsg);
                                conversationService.touch(userId, conv.getId());
                                log.warn("流式异常，已保存部分 AI 回复 ({} 字符)", partialContent.length());
                            }
                        } else {
                            savedToDb.set(true);
                        }
                        sendEvent(emitter, "error", error.getMessage());
                        try { emitter.complete(); } catch (Exception ignored) {}
                    },
                    () -> {
                        if (!savedToDb.getAndSet(true)) {
                            Message assistantMsg = new Message();
                            assistantMsg.setConversationId(conv.getId());
                            assistantMsg.setRole("assistant");
                            assistantMsg.setContent(fullContent.toString());
                            if (!fullThinking.isEmpty()) {
                                assistantMsg.setThinking(fullThinking.toString());
                            }
                            messageMapper.insert(assistantMsg);
                            conversationService.touch(userId, conv.getId());

                            if (searchEnabled && !searchResults.isEmpty()) {
                                try {
                                    String sourcesJson = objectMapper.writeValueAsString(searchResults);
                                    sendEvent(emitter, "sources", sourcesJson);
                                } catch (JsonProcessingException e) {
                                    log.warn("序列化搜索结果失败", e);
                                }
                            }

                            sendEvent(emitter, "done", "{\"messageId\":" + assistantMsg.getId() + "}");
                        }
                        try { emitter.complete(); } catch (Exception ignored) {}
                    }
            );
            disposableRef.set(disposable);
        } catch (Exception e) {
            log.error("Stream setup error: {}", e.getMessage(), e);
            sendEvent(emitter, "error", e.getMessage());
            emitter.complete();
        }
    }

    private static final Set<String> EXTRACTABLE_MIME_PREFIXES = Set.of(
            "text/",
            "application/pdf",
            "application/msword",
            "application/vnd.ms-excel",
            "application/vnd.ms-powerpoint"
    );

    private String extractTextContent(com.aichat.entity.File file) {
        String mime = file.getMimeType();
        if (mime == null) return null;

        boolean supported = EXTRACTABLE_MIME_PREFIXES.stream().anyMatch(mime::startsWith)
                || mime.contains("openxmlformats-officedocument");
        if (!supported) return null;

        try {
            Resource resource = fileService.loadAsResource(file.getId());
            String content = TIKA.parseToString(resource.getInputStream());
            if (content == null || content.isBlank()) return null;
            if (content.length() > maxExtractChars) {
                content = content.substring(0, maxExtractChars) + "\n\n（内容已截断）";
            }
            return content;
        } catch (Exception e) {
            log.warn("文件内容提取失败: {}, mimeType={}", file.getOriginalName(), mime, e);
            return null;
        }
    }

    private UserMessage buildUserMessage(String content, List<Long> fileIds, Set<Long> extractedFileIds) {
        if (fileIds == null || fileIds.isEmpty()) {
            return new UserMessage(content);
        }

        List<com.aichat.entity.File> files = fileService.getByIds(fileIds);
        if (files.isEmpty()) return new UserMessage(content);

        StringBuilder textContent = new StringBuilder(content);
        if (!content.isBlank()) textContent.append("\n\n");
        java.util.List<org.springframework.ai.content.Media> mediaList = new java.util.ArrayList<>();

        for (com.aichat.entity.File file : files) {
            String mime = file.getMimeType();
            if (mime != null && mime.startsWith("image/")) {
                try {
                    java.nio.file.Path path = java.nio.file.Paths.get(uploadDir, file.getStoredName());
                    byte[] imageBytes = java.nio.file.Files.readAllBytes(path);
                    String base64 = Base64.getEncoder().encodeToString(imageBytes);
                    mediaList.add(new org.springframework.ai.content.Media(
                            org.springframework.util.MimeTypeUtils.parseMimeType(mime),
                            java.net.URI.create("data:" + mime + ";base64," + base64)));
                } catch (IOException e) {
                    log.warn("读取图片失败: {}", file.getOriginalName());
                    textContent.append("[图片: ").append(file.getOriginalName()).append("]\n");
                }
            } else if (!extractedFileIds.contains(file.getId())) {
                textContent.append("[文件: ").append(file.getOriginalName()).append("]\n");
            }
        }

        if (mediaList.isEmpty()) {
            return new UserMessage(textContent.toString());
        }
        return UserMessage.builder()
                .text(textContent.toString())
                .media(mediaList)
                .build();
    }

    private void sendError(SseEmitter emitter, String msg) {
        sendEvent(emitter, "error", msg);
        emitter.complete();
    }

    private void sendEvent(SseEmitter emitter, String name, String data) {
        try {
            emitter.send(SseEmitter.event().name(name).data(data));
        } catch (IOException | IllegalStateException ignored) {}
    }

    void autoRenameConversation(Long userId, Long convId, String userContent) {
        String title = userContent.trim();
        if (title.length() > 30) {
            title = title.substring(0, 30) + "...";
        }
        if (title.isBlank()) return;

        try {
            Conversation conv = conversationService.getById(convId, userId);
            if (conv != null && (conv.getTitle() == null || conv.getTitle().isBlank())) {
                conv.setTitle(title);
                conversationService.update(userId, conv);
            }
        } catch (Exception e) {
            log.warn("Auto-rename failed: {}", e.getMessage());
        }
    }
}