import { useState, useCallback, useRef, useEffect } from 'react';
import { chatStream, regenerateStream } from '../api/chat';
import { useChatStore } from '../store';
import type { SearchResult } from '../types';

export function useChatStream() {
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [thinkingContent, setThinkingContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const abortRef = useRef<(() => void) | null>(null);
  const mountedRef = useRef(true);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  const setCurrentConvId = useChatStore((s) => s.setCurrentConvId);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.();
      abortRef.current = null;
    };
  }, []);

  const stop = useCallback(async () => {
    abortRef.current?.();
    abortRef.current = null;
    const convId = useChatStore.getState().currentConvId;
    if (convId && mountedRef.current) {
      const prevLen = useChatStore.getState().messages.length;
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000));
        if (!mountedRef.current) return;
        await selectConversation(convId);
        if (useChatStore.getState().messages.length > prevLen) break;
      }
    }
    if (!mountedRef.current) return;
    setStreaming(false);
    setStreamContent('');
    setThinkingContent('');
  }, [selectConversation]);

  const startStreamInternal = useCallback(async (streamFn: () => Promise<void>) => {
    setStreaming(true);
    setStreamContent('');
    setThinkingContent('');
    setErrorMessage('');
    try {
      await streamFn();
    } catch (err) {
      const message = err instanceof Error ? err.message : '请求失败，请稍后重试';
      setErrorMessage(message);
      setStreaming(false);
      setStreamContent('');
      setThinkingContent('');
    }
  }, []);

  const send = useCallback(async (
    convId: number, text: string, fileIds?: number[], searchEnabled?: boolean,
  ) => {
    await startStreamInternal(async () => {
      let actualConvId = convId;
      if (!actualConvId) {
        actualConvId = await createConversation('');
        setCurrentConvId(actualConvId);
      }
      const pendingSourcesRef: { current: SearchResult[] | null } = { current: null };
      const { promise, abort } = chatStream(actualConvId, text, {
        onMessage: (t) => setStreamContent((prev) => prev + t),
        onThinking: (t) => setThinkingContent((prev) => prev + t),
        onSources: (sources) => { pendingSourcesRef.current = sources; },
        onDone: async (messageId) => {
          setStreaming(false);
          if (messageId && pendingSourcesRef.current) {
            useChatStore.getState().setMessageSearchResults(messageId, pendingSourcesRef.current);
          }
          await selectConversation(actualConvId);
          await useChatStore.getState().loadConversations();
          setStreamContent('');
          setThinkingContent('');
        },
        onError: (msg) => {
          setErrorMessage(msg);
          setStreaming(false);
          setStreamContent('');
          setThinkingContent('');
        },
        onFinally: () => setStreaming(false),
      }, fileIds, searchEnabled);
      abortRef.current = abort;
      await promise;
    });
  }, [startStreamInternal, createConversation, setCurrentConvId, selectConversation]);

  const regenerate = useCallback(async (messageId: number) => {
    // 立即从本地移除被替换的旧 AI 回复及之后的所有消息
    const msgs = useChatStore.getState().messages;
    const idx = msgs.findIndex(m => m.id === messageId);
    if (idx >= 0) {
      for (let i = idx; i >= 0; i--) {
        if (msgs[i].role === 'user') {
          useChatStore.setState({ messages: msgs.slice(0, i + 1) });
          break;
        }
      }
    }

    await startStreamInternal(async () => {
      const { promise, abort } = regenerateStream(messageId, {
        onMessage: (t) => setStreamContent((prev) => prev + t),
        onThinking: (t) => setThinkingContent((prev) => prev + t),
        onDone: async () => {
          setStreaming(false);
          const convId = useChatStore.getState().currentConvId;
          if (convId) await selectConversation(convId);
          await useChatStore.getState().loadConversations();
          setStreamContent('');
          setThinkingContent('');
        },
        onError: (msg) => {
          setErrorMessage(msg);
          setStreaming(false);
          setStreamContent('');
          setThinkingContent('');
        },
        onFinally: () => setStreaming(false),
      });
      abortRef.current = abort;
      await promise;
    });
  }, [startStreamInternal, selectConversation]);

  return { streaming, streamContent, thinkingContent, errorMessage, send, regenerate, stop };
}
