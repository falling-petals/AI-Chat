export interface User {
  id: number;
  username: string;
  avatar: string | null;
}

export interface Conversation {
  id: number;
  userId: number;
  title: string | null;
  modelProvider: string;
  modelName: string;
  systemPrompt: string | null;
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thinking: string | null;
  createdAt: string;
}

export type MessageVO = Message & { dateLabel?: string; files?: FileInfo[] };

export interface ModelConfig {
  id?: number;
  userId?: number;
  provider: string;
  modelName: string;
  apiKey: string;
  baseUrl: string | null;
  isActive: boolean;
}

export interface FileInfo {
  id: number;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface LoginResponse {
  token: string;
  username: string;
  avatar: string | null;
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
}
