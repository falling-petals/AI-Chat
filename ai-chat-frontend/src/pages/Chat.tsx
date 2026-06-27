import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useChatStore } from '../store';
import { chatStream, regenerateStream } from '../api/chat';
import type { MessageVO } from '../types';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import StreamingMessage from './StreamingMessage';
import ChatInput from './ChatInput';

export default function Chat() {
  const navigate = useNavigate();
  const {
    conversations, currentConvId, messages,
    loadConversations, selectConversation, createConversation, deleteConversation,
    togglePin, toggleArchive,
    setCurrentConvId, appendMessage, updateMessage, deleteMessage,
    editingMessage, setEditingMessage,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [thinkingContent, setThinkingContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const startStream = useCallback(async (
    streamFn: () => Promise<void>,
  ) => {
    setStreaming(true);
    setStreamContent('');
    setThinkingContent('');
    setErrorMessage('');
    try {
      await streamFn();
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败，请稍后重试';
      setErrorMessage(message);
      setStreaming(false);
      setStreamContent('');
      setThinkingContent('');
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const text = input;
    setInput('');

    if (editingMessage) {
      await startStream(async () => {
        await updateMessage(editingMessage.id, text);
        setEditingMessage(null);

        const allMessages = useChatStore.getState().messages;
        const editIdx = allMessages.findIndex(m => m.id === editingMessage.id);
        const nextAiMsg = allMessages.slice(editIdx + 1).find(m => m.role === 'assistant');

        if (nextAiMsg) {
          await regenerateStream(
            nextAiMsg.id,
            (t) => setStreamContent((prev) => prev + t),
            (t) => setThinkingContent((prev) => prev + t),
            async () => {
              setStreaming(false);
              setStreamContent('');
              setThinkingContent('');
              if (currentConvId) await selectConversation(currentConvId);
            },
            (msg) => {
              setErrorMessage(msg);
              setStreaming(false);
              setStreamContent('');
              setThinkingContent('');
            },
            () => setStreaming(false),
          );
        } else {
          // No AI message to regenerate (user edited but AI hasn't responded yet)
          setStreaming(false);
        }
      });
      return;
    }

    // Normal send
    await startStream(async () => {
      let convId = currentConvId;
      if (!convId) {
        convId = await createConversation('');
        setCurrentConvId(convId);
      }

      appendMessage({
        id: Date.now(),
        conversationId: convId,
        role: 'user',
        content: text,
        thinking: null,
        createdAt: new Date().toISOString(),
      });

      await chatStream(
        convId,
        text,
        (t) => setStreamContent((prev) => prev + t),
        (t) => setThinkingContent((prev) => prev + t),
        async () => {
          setStreaming(false);
          setStreamContent('');
          setThinkingContent('');
          await selectConversation(convId!);
        },
        (msg) => {
          setErrorMessage(msg);
          setStreaming(false);
          setStreamContent('');
          setThinkingContent('');
        },
        () => setStreaming(false),
      );
    });
  }, [input, streaming, currentConvId, editingMessage, createConversation, selectConversation,
      setCurrentConvId, appendMessage, updateMessage, setEditingMessage, startStream]);

  const handleEdit = useCallback((msg: MessageVO) => {
    setInput(msg.content);
    setEditingMessage(msg);
  }, [setEditingMessage]);

  const handleCancelEdit = useCallback(() => {
    setInput('');
    setEditingMessage(null);
  }, [setEditingMessage]);

  const handleDelete = useCallback(async (id: number) => {
    await deleteMessage(id);
  }, [deleteMessage]);

  const handleRegenerate = useCallback(async (messageId: number) => {
    await startStream(async () => {
      await regenerateStream(
        messageId,
        (t) => setStreamContent((prev) => prev + t),
        (t) => setThinkingContent((prev) => prev + t),
        async () => {
          setStreaming(false);
          setStreamContent('');
          setThinkingContent('');
          if (currentConvId) await selectConversation(currentConvId);
        },
        (msg) => {
          setErrorMessage(msg);
          setStreaming(false);
          setStreamContent('');
          setThinkingContent('');
        },
        () => setStreaming(false),
      );
    });
  }, [currentConvId, selectConversation, startStream]);

  const setToken = useChatStore((s) => s.setToken);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setToken(null);
    navigate('/login');
  };

  const handleNewChat = () => {
    setCurrentConvId(null);
    setInput('');
    setEditingMessage(null);
  };

  return (
    <div className="h-screen flex bg-[#F5F3FF]">
      <Sidebar
        conversations={conversations}
        currentConvId={currentConvId}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        onTogglePin={togglePin}
        onToggleArchive={toggleArchive}
        onNewChat={handleNewChat}
        onSettings={() => navigate('/settings')}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col">
        {currentConvId ? (
          <>
            <MessageList
              messages={messages}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
            />
            <StreamingMessage
              content={streamContent}
              thinking={thinkingContent}
              streaming={streaming}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-[#6366F1]/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#1E1B4B] mb-2">Start a new conversation</h2>
              <p className="text-[#64748B] text-sm">Type a message below to begin</p>
            </div>
          </div>
        )}
        <ChatInput
          value={input}
          onChange={(value) => {
            setInput(value);
            if (errorMessage) setErrorMessage('');
          }}
          onSend={handleSend}
          onCancelEdit={handleCancelEdit}
          disabled={streaming}
          errorMessage={errorMessage}
          editing={!!editingMessage}
        />
      </div>
    </div>
  );
}
