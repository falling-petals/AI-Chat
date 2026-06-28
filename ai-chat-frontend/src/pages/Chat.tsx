import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Sparkles, Bot, ArrowRight } from 'lucide-react';
import { useChatStore } from '../store';
import { useChatStream } from '../hooks/useChatStream';
import { useFileUpload } from '../hooks/useFileUpload';
import { useEditMessage } from '../hooks/useEditMessage';
import type { MessageVO } from '../types';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

const EXAMPLE_PROMPTS = [
  'Explain quantum computing in simple terms',
  'Write a Python function to sort a list',
  'What is the meaning of life?',
  'Summarize the theory of relativity',
];

export default function Chat() {
  const navigate = useNavigate();
  const {
    conversations, currentConvId, messages,
    loadConversations, selectConversation, createConversation, deleteConversation,
    togglePin, toggleArchive,
    setCurrentConvId, appendMessage, deleteMessage,
  } = useChatStore();

  const { streaming, streamContent, thinkingContent, errorMessage, send, regenerate, stop } = useChatStream();
  const { files: uploadedFiles, addFiles, removeFile } = useFileUpload();
  const { editingMessage, startEdit, cancelEdit, updateMessage } = useEditMessage();

  const [input, setInput] = useState('');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectConv = useCallback(async (id: number) => {
    await selectConversation(id);
    setSidebarOpen(false);
  }, [selectConversation]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || streaming) return;

    const text = input;
    const fileIds = uploadedFiles.filter(f => !f.uploading).map(f => f.fileInfo.id);
    setInput('');
    uploadedFiles.forEach(f => removeFile(f.fileInfo.id));

    if (editingMessage) {
      await updateMessage(editingMessage.id, text);
      cancelEdit();

      const allMessages = useChatStore.getState().messages;
      const editIdx = allMessages.findIndex(m => m.id === editingMessage.id);
      const nextAiMsg = allMessages.slice(editIdx + 1).find(m => m.role === 'assistant');

      if (nextAiMsg) {
        await regenerate(nextAiMsg.id);
      }
      return;
    }

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
      files: uploadedFiles.filter(f => !f.uploading).map(f => f.fileInfo),
    });

    await send(convId, text, fileIds, searchEnabled);
  }, [input, streaming, currentConvId, editingMessage, uploadedFiles, createConversation,
      setCurrentConvId, appendMessage, updateMessage, cancelEdit, regenerate, send, searchEnabled, removeFile]);

  const handleEdit = useCallback((msg: MessageVO) => {
    setInput(msg.content);
    startEdit(msg);
  }, [startEdit]);

  const handleCancelEdit = useCallback(() => {
    setInput('');
    cancelEdit();
  }, [cancelEdit]);

  const handleDelete = useCallback(async (id: number) => {
    await deleteMessage(id);
  }, [deleteMessage]);

  const handleRegenerate = useCallback(async (messageId: number) => {
    await regenerate(messageId);
  }, [regenerate]);

  const setToken = useChatStore((s) => s.setToken);

  const handleLogout = () => {
    localStorage.removeItem('username');
    setToken(null);
    navigate('/login');
  };

  const handleNewChat = () => {
    setCurrentConvId(null);
    setInput('');
    setSearchEnabled(false);
    cancelEdit();
    uploadedFiles.forEach(f => removeFile(f.fileInfo.id));
  };

  const handleExampleClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <div className="h-screen flex bg-zinc-50 dark:bg-zinc-900">
      <Sidebar
        conversations={conversations}
        currentConvId={currentConvId}
        onSelect={handleSelectConv}
        onDelete={deleteConversation}
        onTogglePin={togglePin}
        onToggleArchive={toggleArchive}
        onNewChat={handleNewChat}
        onSettings={() => navigate('/settings')}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-30 p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 cursor-pointer"
        >
          <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>
        {currentConvId ? (
          <>
            <MessageList
              messages={messages}
              streaming={streaming}
              streamContent={streamContent}
              thinkingContent={thinkingContent}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                <Bot className="w-8 h-8 text-brand-500" />
              </div>
              <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 mb-2">How can I help you?</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Choose a prompt to get started, or type your own</p>
              <div className="grid grid-cols-2 gap-3">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleExampleClick(p)}
                    className="group text-left p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 hover:border-brand-500/50 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed line-clamp-3">{p}</p>
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-brand-500 mt-2 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onCancelEdit={handleCancelEdit}
          disabled={streaming}
          errorMessage={errorMessage}
          editing={!!editingMessage}
          uploadedFiles={uploadedFiles}
          onUpload={addFiles}
          onRemoveFile={removeFile}
          searchEnabled={searchEnabled}
          onToggleSearch={() => setSearchEnabled((prev) => !prev)}
          streaming={streaming}
          onStop={stop}
        />
      </div>
    </div>
  );
}
