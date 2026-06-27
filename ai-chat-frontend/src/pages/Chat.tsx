import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useChatStore } from '../store';
import { chatStream } from '../api/chat';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import StreamingMessage from './StreamingMessage';
import ChatInput from './ChatInput';

export default function Chat() {
  const navigate = useNavigate();
  const {
    conversations, currentConvId, messages,
    loadConversations, selectConversation, createConversation, deleteConversation, setCurrentConvId, appendMessage,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [thinkingContent, setThinkingContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => { loadConversations(); }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const userMsg = input;
    setInput('');
    setStreaming(true);
    setStreamContent('');
    setThinkingContent('');
    setErrorMessage('');

    try {
      let convId = currentConvId;
      if (!convId) {
        convId = await createConversation(userMsg.slice(0, 50));
        setCurrentConvId(convId);
      }

      appendMessage({
        id: Date.now(),
        conversationId: convId,
        role: 'user',
        content: userMsg,
        thinking: null,
        createdAt: new Date().toISOString(),
      });

      // Clear error on each new send if it was showing
      setErrorMessage('');

      await chatStream(
        convId,
        userMsg,
        (text) => setStreamContent((prev) => prev + text),
        (text) => setThinkingContent((prev) => prev + text),
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
        () => {
          setStreaming(false);
        },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : '发送失败，请稍后重试';
      setErrorMessage(message);
      setStreaming(false);
      setStreamContent('');
      setThinkingContent('');
    }
  }, [input, streaming, currentConvId, createConversation, selectConversation, setCurrentConvId, appendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
  };

  return (
    <div className="h-screen flex bg-[#F5F3FF]">
      <Sidebar
        conversations={conversations}
        currentConvId={currentConvId}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        onNewChat={handleNewChat}
        onSettings={() => navigate('/settings')}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col">
        {currentConvId ? (
          <>
            <MessageList messages={messages} />
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
          onKeyDown={handleKeyDown}
          disabled={streaming}
          errorMessage={errorMessage}
        />
      </div>
    </div>
  );
}
