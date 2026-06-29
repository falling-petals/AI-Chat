import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bot, PanelLeft } from 'lucide-react';
import { useChatStore } from '../store';
import { useChatStream } from '../hooks/useChatStream';
import { useFileUpload } from '../hooks/useFileUpload';
import { useEditMessage } from '../hooks/useEditMessage';
import type { MessageVO } from '../types';
import Sidebar from './Sidebar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';


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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSelectConv = useCallback(async (id: number) => {
    await selectConversation(id);
    setSidebarOpen(false);
  }, [selectConversation]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // 刷新页面时从后端重新加载当前会话的消息（localStorage 可能已过时）
  useEffect(() => {
    if (currentConvId) {
      selectConversation(currentConvId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        return;
      }
      // 编辑后无后续 AI 回复 → 直接触发新的 AI 响应
      const convId = editingMessage.conversationId;
      if (convId) {
        setCurrentConvId(convId);
        await send(convId, text, [], searchEnabled);
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
    if (streaming) return;
    await regenerate(messageId);
  }, [regenerate, streaming]);

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

  return (
    <div className="h-screen flex bg-white dark:bg-[#151515]">
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
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="fixed left-3 top-3 z-50 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          title="展开侧边栏"
        >
          <PanelLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </button>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-3 left-3 z-30 p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700 cursor-pointer"
        >
          <Menu className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
        </button>
        {currentConvId ? (
          <MessageList
              messages={messages}
              streaming={streaming}
              streamContent={streamContent}
              thinkingContent={thinkingContent}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
            />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <Bot className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
            <h1 className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
              How can I help you today?
            </h1>
          </div>
        )}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onCancelEdit={handleCancelEdit}
          disabled={false}
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
