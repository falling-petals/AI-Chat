import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store';
import { Plus, Trash2, Send, LogOut, MessageSquare, Sparkles, Settings } from 'lucide-react';

export default function Chat() {
  const navigate = useNavigate();
  const {
    conversations, currentConvId, messages, loading,
    loadConversations, selectConversation, createConversation, deleteConversation, setCurrentConvId,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamContent]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;

    let convId = currentConvId;
    if (!convId) {
      convId = await createConversation(input.slice(0, 50));
      setCurrentConvId(convId);
    }

    const userMsg = input;
    setInput('');
    setStreaming(true);
    setStreamContent('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ conversationId: convId, content: userMsg }),
      });

      const reader = res.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let buffer = '';
      let eventType = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7).trim();
            continue;
          }
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (eventType === 'message') {
              setStreamContent(prev => prev + data);
            } else if (eventType === 'done') {
              setStreaming(false);
              setStreamContent('');
              await selectConversation(convId!);
            } else if (eventType === 'error') {
              setStreaming(false);
              setStreamContent('');
            }
          }
        }
      }
    } catch (err) {
      setStreaming(false);
      setStreamContent('');
    }
  }, [input, streaming, currentConvId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <div className="h-screen flex bg-[#F5F3FF]">
      {/* Sidebar */}
      <div className="w-72 bg-white/70 backdrop-blur-xl border-r border-white/20 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#6366F1]" />
              <span className="font-semibold text-[#1E1B4B]">AI Chat</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => navigate('/settings')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Settings">
                <Settings className="w-4 h-4 text-[#64748B]" />
              </button>
              <button onClick={handleLogout} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer" title="Logout">
                <LogOut className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
          </div>
          <button
            onClick={() => { setCurrentConvId(null); setInput(''); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] transition-colors text-sm font-medium cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                currentConvId === conv.id
                  ? 'bg-[#6366F1]/10 text-[#6366F1]'
                  : 'hover:bg-gray-100 text-[#475569]'
              }`}
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="text-sm truncate flex-1">{conv.title || 'New Chat'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white rounded-lg transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {currentConvId ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[#6366F1] text-white'
                    : 'bg-white/80 backdrop-blur-sm border border-white/20 text-[#1E1B4B]'
                }`}>
                  {msg.thinking && (
                    <details className="mb-2">
                      <summary className="text-xs text-[#64748B] cursor-pointer">Thinking</summary>
                      <p className="text-sm mt-1 text-[#64748B] whitespace-pre-wrap">{msg.thinking}</p>
                    </details>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {streamContent && (
              <div className="flex justify-start">
                <div className="max-w-[70%] px-4 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20">
                  <p className="text-sm whitespace-pre-wrap">{streamContent}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-[#6366F1]/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#1E1B4B] mb-2">Start a new conversation</h2>
              <p className="text-[#64748B] text-sm">Type a message below to begin</p>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-white/20 bg-white/30 backdrop-blur-sm">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <input
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white/70 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
              placeholder={streaming ? 'AI is thinking...' : 'Type a message...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming}
            />
            <button
              onClick={handleSend}
              disabled={streaming || !input.trim()}
              className="p-3 bg-[#6366F1] text-white rounded-xl hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
