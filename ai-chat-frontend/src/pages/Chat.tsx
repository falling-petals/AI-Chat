import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
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
    cancelEdit();
    uploadedFiles.forEach(f => removeFile(f.fileInfo.id));
  };

  return (
    <div className="h-screen flex bg-[#F5F3FF] dark:bg-slate-900">
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
              streaming={streaming}
              streamContent={streamContent}
              thinkingContent={thinkingContent}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRegenerate={handleRegenerate}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-[#6366F1]/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-[#1E1B4B] dark:text-slate-100 mb-2">Start a new conversation</h2>
              <p className="text-[#64748B] dark:text-slate-400 text-sm">Type a message below to begin</p>
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
