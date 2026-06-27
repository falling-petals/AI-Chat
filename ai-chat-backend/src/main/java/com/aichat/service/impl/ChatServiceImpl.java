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
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.concurrent.atomic.AtomicReference;
import reactor.core.Disposable;
import org.apache.tika.Tika;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger log = LoggerFactory.getLogger(ChatServiceImpl.class);

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

    public ChatServiceImpl(Map<String, ChatModelProvider> providers,
                            ModelConfigService modelConfigService,
                            ConversationService conversationService,
                            MessageService messageService,
                            MessageMapper messageMapper,
                            FileService fileService,
                            TavilyService tavilyService) {
        this.providers = providers;
        this.modelConfigService = modelConfigService;
        this.conversationService = conversationService;
        this.messageService = messageService;
        this.messageMapper = messageMapper;
        this.fileService = fileService;
        this.tavilyService = tavilyService;
        this.objectMapper = new ObjectMapper();
    }

    public SseEmitter stream(Long userId, Long conversationId, String content, List<Long> fileIds, Boolean searchEnabled) {
        SseEmitter emitter = createEmitter(userId);

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
        messageMapper.insert(userMsg);

        streamAiResponse(emitter, userId, conv, content, fileIds, searchEnabled != null && searchEnabled);
        return emitter;
    }

    public SseEmitter regenerate(Long userId, Long messageId) {
        SseEmitter emitter = createEmitter(userId);

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

        // Parse fileIds from the stored user message for regenerate
        List<Long> fileIds = new ArrayList<>();
        if (userMsg.getFileIds() != null && !userMsg.getFileIds().isBlank()) {
            try {
                fileIds = objectMapper.readValue(userMsg.getFileIds(),
                        new com.fasterxml.jackson.core.type.TypeReference<List<Long>>() {});
            } catch (Exception ignored) {}
        }

        streamAiResponse(emitter, userId, conv, userMsg.getContent(), fileIds, false);
        return emitter;
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

    private void streamAiResponse(SseEmitter emitter, Long userId, Conversation conv, String userContent, List<Long> fileIds, boolean searchEnabled) {
        ModelConfig config = modelConfigService.getActive(userId);
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
        if (conv.getSystemPrompt() != null && !conv.getSystemPrompt().isBlank()) {
            messages.add(new SystemMessage(conv.getSystemPrompt()));
        }

        final List<SearchResult> searchResults;
        if (searchEnabled) {
            searchResults = tavilyService.search(userContent);
            if (!searchResults.isEmpty()) {
                StringBuilder sb = new StringBuilder("以下是来自互联网搜索的相关信息，请参考这些信息来回答用户问题：\n\n");
                for (int i = 0; i < searchResults.size(); i++) {
                    SearchResult r = searchResults.get(i);
                    sb.append("[").append(i + 1).append("] ").append(r.getTitle()).append("\n");
                    sb.append("    来源: ").append(r.getUrl()).append("\n");
                    sb.append("    内容: ").append(r.getContent()).append("\n\n");
                }
                messages.add(new SystemMessage(sb.toString()));
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
                    messages.add(new SystemMessage(
                            "用户上传了文档「" + f.getOriginalName() + "」，其文本内容如下：\n\n" + extracted));
                    extractedFileIds.add(f.getId());
                }
            }
        }
        messages.add(buildUserMessage(userContent, fileIds, extractedFileIds));

        StringBuilder fullContent = new StringBuilder();
        StringBuilder fullThinking = new StringBuilder();

        try {
            AtomicReference<Disposable> disposableRef = new AtomicReference<>();
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
                        sendEvent(emitter, "error", error.getMessage());
                        emitter.complete();
                    },
                    () -> {
                        Message assistantMsg = new Message();
                        assistantMsg.setConversationId(conv.getId());
                        assistantMsg.setRole("assistant");
                        assistantMsg.setContent(fullContent.toString());
                        if (!fullThinking.isEmpty()) {
                            assistantMsg.setThinking(fullThinking.toString());
                        }
                        messageMapper.insert(assistantMsg);

                        if (searchEnabled && !searchResults.isEmpty()) {
                            try {
                                String sourcesJson = objectMapper.writeValueAsString(searchResults);
                                sendEvent(emitter, "sources", sourcesJson);
                            } catch (JsonProcessingException e) {
                                log.warn("序列化搜索结果失败", e);
                            }
                        }

                        sendEvent(emitter, "done", "{\"messageId\":" + assistantMsg.getId() + "}");
                        emitter.complete();

                        if (conv.getTitle() == null || conv.getTitle().isBlank()) {
                            autoRenameConversation(userId, conv.getId(), userContent);
                        }
                    }
            );
            disposableRef.set(disposable);
            emitter.onCompletion(() -> {
                if (disposableRef.get() != null && !disposableRef.get().isDisposed()) {
                    disposableRef.get().dispose();
                }
            });
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
            Tika tika = new Tika();
            Resource resource = fileService.loadAsResource(file.getId());
            String content = tika.parseToString(resource.getInputStream());
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
                    java.nio.file.Path path = java.nio.file.Paths.get("./uploads", file.getStoredName());
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
        } catch (IOException ignored) {}
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