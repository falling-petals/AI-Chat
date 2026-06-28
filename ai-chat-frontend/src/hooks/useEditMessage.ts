import { useState, useCallback } from 'react';
import type { MessageVO } from '../types';
import { useChatStore } from '../store';

export function useEditMessage() {
  const updateMessage = useChatStore((s) => s.updateMessage);
  const [editingMessage, _setEditingMessage] = useState<MessageVO | null>(null);
  const startEdit = useCallback((msg: MessageVO) => _setEditingMessage(msg), []);
  const cancelEdit = useCallback(() => _setEditingMessage(null), []);
  return { editingMessage, startEdit, cancelEdit, updateMessage };
}
