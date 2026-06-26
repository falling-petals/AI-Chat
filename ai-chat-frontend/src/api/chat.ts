import request from './client';
import type { Conversation, Message, ModelConfig } from '../types';

export const conversationApi = {
  list: () => request<Conversation[]>('/conversations'),

  create: (data: Partial<Conversation>) =>
    request<number>('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  get: (id: number) => request<Conversation>(`/conversations/${id}`),

  delete: (id: number) =>
    request<void>(`/conversations/${id}`, { method: 'DELETE' }),
};

export const messageApi = {
  list: (conversationId: number) =>
    request<Message[]>(`/chat/messages/${conversationId}`),
};

export const modelConfigApi = {
  list: () => request<ModelConfig[]>('/model-configs'),

  save: (config: ModelConfig) =>
    request<void>('/model-configs', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  delete: (id: number) =>
    request<void>(`/model-configs/${id}`, { method: 'DELETE' }),
};
