import request from './client';
import type { Conversation, MessageVO, ModelConfig, FileInfo, SearchResult } from '../types';

export interface SSEOptions {
  onMessage: (text: string) => void;
  onThinking: (text: string) => void;
  onSources?: (sources: SearchResult[]) => void;
  onDone: (messageId?: number) => void;
  onError: (msg: string) => void;
  onFinally?: () => void;
}

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

  togglePin: (id: number) =>
    request<void>(`/conversations/${id}/pin`, { method: 'PUT' }),

  toggleArchive: (id: number) =>
    request<void>(`/conversations/${id}/archive`, { method: 'PUT' }),
};

export const messageApi = {
  list: (conversationId: number) =>
    request<MessageVO[]>(`/chat/messages/${conversationId}`),

  update: (id: number, content: string) =>
    request<void>(`/chat/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),

  delete: (id: number) =>
    request<void>(`/chat/messages/${id}`, { method: 'DELETE' }),
};

export const fileApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    return fetch('/api/files/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    }).then(async (res) => {
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || '上传失败');
      return json.data as FileInfo;
    });
  },

  delete: (id: number) =>
    request<void>(`/files/${id}`, { method: 'DELETE' }),
};

export const modelConfigApi = {
  list: () => request<ModelConfig[]>('/model-configs'),

  save: (config: Partial<ModelConfig>) =>
    request<void>('/model-configs', {
      method: 'POST',
      body: JSON.stringify(config),
    }),

  update: (id: number, config: Partial<ModelConfig>) =>
    request<void>(`/model-configs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),

  activate: (id: number) =>
    request<void>(`/model-configs/${id}/activate`, { method: 'PUT' }),

  delete: (id: number) =>
    request<void>(`/model-configs/${id}`, { method: 'DELETE' }),
};

async function readSSEStream(
  endpoint: string,
  body: object,
  options: SSEOptions,
  signal?: AbortSignal,
): Promise<void> {
  const { onMessage, onThinking, onSources, onDone, onError, onFinally } = options;
  const token = localStorage.getItem('token');

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      throw new Error(`请求失败（HTTP ${res.status}）`);
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error('未收到流式响应');
    }

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
        if (line.startsWith('event:')) {
          eventType = line.slice(6).trim();
          continue;
        }
        if (line.startsWith('data:')) {
          const data = line.slice(5);
          if (eventType === 'message') {
            onMessage(data);
          } else if (eventType === 'thinking') {
            onThinking(data);
          } else if (eventType === 'sources') {
            try {
              onSources?.(JSON.parse(data));
            } catch { /* ignore parse errors */ }
          } else if (eventType === 'done') {
            let messageId: number | undefined;
            try {
              const parsed = JSON.parse(data);
              messageId = parsed.messageId;
            } catch { /* data may be empty string */ }
            onDone(messageId);
          } else if (eventType === 'error') {
            onError(data.trim() || '操作失败，请重试');
          }
        }
      }
    }
  } finally {
    onFinally?.();
  }
}

function createSSEStream(
  endpoint: string,
  body: object,
  options: SSEOptions,
): { promise: Promise<void>; abort: () => void } {
  const controller = new AbortController();
  const promise = readSSEStream(endpoint, body, options, controller.signal)
    .catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      throw err;
    });
  return {
    promise,
    abort: () => controller.abort(),
  };
}

export function chatStream(
  conversationId: number,
  content: string,
  options: SSEOptions,
  fileIds?: number[],
  searchEnabled?: boolean,
): { promise: Promise<void>; abort: () => void } {
  return createSSEStream(
    '/api/chat/stream',
    { conversationId, content, fileIds, searchEnabled },
    options,
  );
}

export function regenerateStream(
  messageId: number,
  options: SSEOptions,
): { promise: Promise<void>; abort: () => void } {
  return createSSEStream(
    `/api/chat/messages/${messageId}/regenerate`,
    {},
    options,
  );
}
