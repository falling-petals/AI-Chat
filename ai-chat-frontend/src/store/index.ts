import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Conversation, MessageVO, SearchResult } from '../types';
import { conversationApi, messageApi } from '../api/chat';

interface ChatStore {
  token: string | null;
  theme: 'light' | 'dark' | 'system';
  conversations: Conversation[];
  currentConvId: number | null;
  messages: MessageVO[];
  loading: boolean;
  editingMessage: MessageVO | null;
  messageSearchResults: Record<number, SearchResult[]>;

  setToken: (token: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  loadConversations: () => Promise<void>;
  selectConversation: (id: number) => Promise<void>;
  createConversation: (title?: string) => Promise<number>;
  deleteConversation: (id: number) => Promise<void>;
  togglePin: (id: number) => Promise<void>;
  toggleArchive: (id: number) => Promise<void>;
  setCurrentConvId: (id: number | null) => void;
  appendMessage: (msg: MessageVO) => void;
  updateMessage: (id: number, content: string) => Promise<void>;
  deleteMessage: (id: number) => Promise<void>;
  setEditingMessage: (msg: MessageVO | null) => void;
  setMessageSearchResults: (messageId: number, results: SearchResult[]) => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      token: null,
      theme: 'system',
      conversations: [],
      currentConvId: null,
      messages: [],
      loading: false,
      editingMessage: null,
      messageSearchResults: {},

      setToken: (token) => set({ token }),
      setTheme: (theme) => set({ theme }),

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

      setMessageSearchResults: (messageId, results) =>
        set((state) => ({
          messageSearchResults: { ...state.messageSearchResults, [messageId]: results },
        })),
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

window.addEventListener('storage', (e) => {
  if (e.key === 'chat-store') {
    const parsed = JSON.parse(e.newValue ?? '{}');
    const { state } = parsed;
    if (state?.token !== undefined) {
      useChatStore.setState({ token: state.token });
    }
  }
});
