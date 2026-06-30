import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, PanelLeft } from 'lucide-react';
import { useChatStore } from '../store';
import { useChatStream } from '../hooks/useChatStream';
import { useFileUpload } from '../hooks/useFileUpload';
import { useEditMessage } from '../hooks/useEditMessage';
import { modelApi } from '../api/chat';
import type { MessageVO, ModelInfo } from '../types';
import Sidebar from './Sidebar';
import TypeWriterText from '../components/TypeWriterText';

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';

  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  if (msgDate >= monday) {
    return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
  }

  return '更早';
}
import MessageList from './MessageList';
import ChatInput from './ChatInput';


export default function Chat() {
  const navigate = useNavigate();
  const conversations = useChatStore(s => s.conversations);
  const currentConvId = useChatStore(s => s.currentConvId);
  const messages = useChatStore(s => s.messages);
  const loadConversations = useChatStore(s => s.loadConversations);
  const selectConversation = useChatStore(s => s.selectConversation);
  const createConversation = useChatStore(s => s.createConversation);
  const deleteConversation = useChatStore(s => s.deleteConversation);
  const togglePin = useChatStore(s => s.togglePin);
  const toggleArchive = useChatStore(s => s.toggleArchive);
  const setCurrentConvId = useChatStore(s => s.setCurrentConvId);
  const appendMessage = useChatStore(s => s.appendMessage);
  const deleteMessage = useChatStore(s => s.deleteMessage);

  const { streaming, streamContent, thinkingContent, errorMessage, send, regenerate, stop } = useChatStream();
  const { files: uploadedFiles, addFiles, removeFile } = useFileUpload();
  const { editingMessage, startEdit, cancelEdit, updateMessage } = useEditMessage();

  const [input, setInput] = useState('');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<{ provider: string; name: string } | null>(null);

  const handleSelectConv = useCallback(async (id: number) => {
    await selectConversation(id);
    setSidebarOpen(false);
  }, [selectConversation]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    modelApi.available().then((models) => {
      setAvailableModels(models);
      if (models.length > 0 && !selectedModel) {
        setSelectedModel({ provider: models[0].provider, name: models[0].modelName });
      }
    }).catch(() => {});
  }, []);

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
      // 编辑后无后续 AI 回复 → 从后端重新加载，清理中止残留的消息后再发送
      const convId = editingMessage.conversationId;
      if (convId) {
        await selectConversation(convId);
        const msgs = useChatStore.getState().messages;
        const lastUser = [...msgs].reverse().find(m => m.role === 'user');
        if (lastUser) {
          const startIdx = msgs.indexOf(lastUser);
          const ids = msgs.slice(startIdx).map(m => m.id);
          for (const id of ids) {
            await deleteMessage(id);
          }
        }
        const nowISO = new Date().toISOString();
        appendMessage({
          id: Date.now(),
          conversationId: convId,
          role: 'user',
          content: text,
          thinking: null,
          createdAt: nowISO,
          dateLabel: getDateLabel(nowISO),
          files: [],
        });
        await send(convId, text, [], searchEnabled, selectedModel?.provider, selectedModel?.name);
      }
      return;
    }

    let convId = currentConvId;
    if (!convId) {
      convId = await createConversation('');
      setCurrentConvId(convId);
    }

    const nowISO = new Date().toISOString();
    appendMessage({
      id: Date.now(),
      conversationId: convId,
      role: 'user',
      content: text,
      thinking: null,
      createdAt: nowISO,
      dateLabel: getDateLabel(nowISO),
      files: uploadedFiles.filter(f => !f.uploading).map(f => f.fileInfo),
    });

    await send(convId, text, fileIds, searchEnabled, selectedModel?.provider, selectedModel?.name);
  }, [input, streaming, currentConvId, editingMessage, uploadedFiles, createConversation,
      setCurrentConvId, appendMessage, updateMessage, cancelEdit, regenerate, send, searchEnabled, removeFile, selectedModel]);

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
    setCurrentConvId(null);
    navigate('/login');
  };

  const handleNewChat = () => {
    stop();
    setCurrentConvId(null);
    setInput('');
    setSearchEnabled(false);
    cancelEdit();
    uploadedFiles.forEach(f => removeFile(f.fileInfo.id));
  };

  return (
    <div className="h-screen flex bg-white dark:bg-[#151515] overflow-x-hidden">
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
            <img src="/logo.svg" alt="AI Chat" className="w-12 h-12 opacity-60" />
            <h1 className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
              <TypeWriterText text="How can I help you today?" />
            </h1>
            {availableModels.length === 0 && (
              <p className="text-sm text-zinc-400">
                暂无可用模型，请先在
                <button onClick={() => navigate('/settings')} className="text-sky-500 hover:text-sky-600 underline mx-1">
                  设置
                </button>
                中配置 AI 模型
              </p>
            )}
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
          availableModels={availableModels}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
        />
      </div>
    </div>
  );
}
