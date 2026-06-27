import { create } from 'zustand';
import type { Conversation, Message } from '../types';
import { conversationApi, messageApi } from '../api/chat';

interface ChatStore {
  token: string | null;
  conversations: Conversation[];
  currentConvId: number | null;
  messages: Message[];
  loading: boolean;
  editingMessage: Message | null;

  setToken: (token: string | null) => void;
  loadConversations: () => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  createConversation: (title?: string) => Promise<number>;
  deleteConversation: (id: number) => Promise<void>;
  togglePin: (id: number) => Promise<void>;
  toggleArchive: (id: number) => Promise<void>;
  setCurrentConvId: (id: number | null) => void;
  appendMessage: (msg: Message) => void;
  updateMessage: (id: number, content: string) => Promise<void>;
  deleteMessage: (id: number) => Promise<void>;
  setEditingMessage: (msg: Message | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  token: localStorage.getItem('token'),
  conversations: [],
  currentConvId: null,
  messages: [],
  loading: false,
  editingMessage: null,

  setToken: (token) => set({ token }),

  loadConversations: async () => {
    const list = await conversationApi.list();
    set({ conversations: list });
  },

  selectConversation: async (id: number) => {
    set({ currentConvId: id, loading: true });
    const messages = await messageApi.list(id);
    set({ messages, loading: false });
  },

  createConversation: async (title?: string) => {
    const id = await conversationApi.create({ title: title || '' });
    await get().loadConversations();
    return id;
  },

  deleteConversation: async (id: number) => {
    await conversationApi.delete(id);
    const { currentConvId } = get();
    if (currentConvId === id) {
      set({ currentConvId: null, messages: [] });
    }
    await get().loadConversations();
  },

  togglePin: async (id: number) => {
    await conversationApi.togglePin(id);
    set((state) => {
      const list = state.conversations.map((c) =>
        c.id === id ? { ...c, pinned: !c.pinned } : c
      );
      list.sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
      return { conversations: list };
    });
  },

  toggleArchive: async (id: number) => {
    await conversationApi.toggleArchive(id);
    const { currentConvId } = get();
    if (currentConvId === id) {
      set({ currentConvId: null, messages: [] });
    }
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, archived: !c.archived } : c
      ),
    }));
  },

  setCurrentConvId: (id) => {
    if (id === null) {
      set({ currentConvId: null, messages: [] });
    } else {
      set({ currentConvId: id });
    }
  },

  appendMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),

  updateMessage: async (id: number, content: string) => {
    await messageApi.update(id, content);
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, content } : m)),
    }));
  },

  deleteMessage: async (id: number) => {
    await messageApi.delete(id);
    set((state) => ({
      messages: state.messages.filter((m) => m.id !== id),
    }));
  },

  setEditingMessage: (msg) => set({ editingMessage: msg }),
}));
