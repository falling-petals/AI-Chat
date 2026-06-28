import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Brain, Pencil, Copy, Trash2, RefreshCw, File, FileText, FileSpreadsheet, User, Bot } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';
import StreamingMessage from './StreamingMessage';
import type { MessageVO } from '../types';
import { useChatStore } from '../store';

interface MessageListProps {
  messages: MessageVO[];
  streaming?: boolean;
  streamContent?: string;
  thinkingContent?: string;
  onEdit: (msg: MessageVO) => void;
  onDelete: (id: number) => Promise<void>;
  onRegenerate: (messageId: number) => void;
}

interface StreamItem {
  _stream: true;
  content: string;
  thinking: string;
}

type ListItem = MessageVO | StreamItem;

function FileAttachment({ file }: { file: { id: number; originalName: string; mimeType: string } }) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const isImage = file.mimeType?.startsWith('image/');

  useEffect(() => {
    if (!isImage) return;
    let cancelled = false;
    let blobUrl: string | null = null;
    const token = useChatStore.getState().token;
    fetch(`/api/files/${file.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        if (!cancelled) {
          blobUrl = URL.createObjectURL(blob);
          setImgSrc(blobUrl);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [file.id, isImage]);

  if (isImage) {
    return (
      <a href={imgSrc || '#'} target="_blank" rel="noopener noreferrer" className="block my-2">
        {imgSrc ? (
          <img src={imgSrc} alt={file.originalName} className="max-w-sm max-h-64 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 hover:opacity-90 transition-opacity" loading="lazy" />
        ) : (
          <div className="w-32 h-24 rounded-xl bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        )}
      </a>
    );
  }
  const mime = file.mimeType ?? '';
  const FileIcon = mime.includes('pdf') ? FileText
    : mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv') ? FileSpreadsheet
    : mime.includes('presentation') || mime.includes('powerpoint') ? FileText
    : mime.startsWith('text/') ? FileText
    : mime.includes('word') || mime.includes('document') ? FileText
    : File;

  return (
    <a
      href={`/api/files/${file.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 my-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
    >
      <FileIcon className="w-4 h-4" />
      <span className="truncate max-w-[200px]">{file.originalName}</span>
    </a>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2 px-4">
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
      <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium shrink-0">{label}</span>
      <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

export default function MessageList({
  messages, streaming = false, streamContent = '', thinkingContent = '',
  onEdit, onDelete, onRegenerate,
}: MessageListProps) {
  const messageSearchResults = useChatStore((s) => s.messageSearchResults);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const allItems = useMemo<ListItem[]>(() => {
    if (streaming || streamContent || thinkingContent) {
      return [...messages, { _stream: true as const, content: streamContent, thinking: thinkingContent }];
    }
    return messages;
  }, [messages, streaming, streamContent, thinkingContent]);

  useEffect(() => {
    if (isAtBottom && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({ index: allItems.length - 1, behavior: 'smooth' });
    }
  }, [allItems.length, streamContent, isAtBottom]);

  const atBottomStateChange = useCallback((atBottom: boolean) => {
    setIsAtBottom(atBottom);
  }, []);

  const handleCopy = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {}
  };

  const handleDeleteMsg = async (id: number) => {
    if (!window.confirm('确定删除这条消息？')) return;
    await onDelete(id);
  };

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="flex-1"
      data={allItems}
      itemContent={(index, item) => {
        if ('_stream' in item) {
          return (
            <div className="px-4 py-2">
              <StreamingMessage content={item.content} thinking={item.thinking} streaming={streaming} />
            </div>
          );
        }
        const msg = item;
        const prev = index > 0 ? allItems[index - 1] : undefined;
        const prevMsg = prev && !('_stream' in prev) ? prev as MessageVO : undefined;
        const showDateLabel = index === 0 || msg.dateLabel !== prevMsg?.dateLabel;
        const isUser = msg.role === 'user';

        return (
          <>
            {showDateLabel && <DateDivider label={msg.dateLabel ?? '更早'} />}
            <div className={`flex gap-3 px-4 py-2 group ${isUser ? 'flex-row-reverse' : ''}`}>
              <div className="shrink-0">
                {isUser ? (
                  <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/50 flex items-center justify-center">
                    <User className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  </div>
                )}
              </div>
              <div className={`flex-1 min-w-0 max-w-[800px] ${isUser ? 'items-end' : ''}`}>
                <div className={`rounded-2xl px-4 py-3 ${
                  isUser
                    ? 'bg-brand-500 text-white rounded-br-md'
                    : 'bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-bl-md'
                }`}>
                  {msg.thinking && (
                    <details className="mb-2">
                      <summary className="flex items-center gap-1.5 text-xs font-medium cursor-pointer select-none transition-colors
                        ${isUser ? 'text-white/80 hover:text-white' : 'text-brand-500 hover:text-brand-600'}"
                        style={isUser ? { color: 'rgba(255,255,255,0.8)' } : {}}>
                        <Brain className="w-3.5 h-3.5" />
                        Thought
                      </summary>
                      <div className={`mt-2 pl-3 border-l-2 ${isUser ? 'border-white/30' : 'border-brand-500/20'}`}>
                        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
                          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ code: CodeBlock }}>{msg.thinking}</ReactMarkdown>
                        </div>
                      </div>
                    </details>
                  )}
                  {msg.files && msg.files.length > 0 && (
                    <div className={`mb-2 space-y-1 ${isUser ? '[&_a]:text-white/80 [&_a]:hover:text-white' : ''}`}>
                      {msg.files.map((file) => (
                        <FileAttachment key={file.id} file={file} />
                      ))}
                    </div>
                  )}
                  <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : ''}`}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ code: CodeBlock }}>{msg.content}</ReactMarkdown>
                  </div>
                  {!isUser && (() => {
                    const results = messageSearchResults[msg.id];
                    if (!results || results.length === 0) return null;
                    return (
                      <div className="mt-3 space-y-2 border-t border-zinc-100 dark:border-zinc-700 pt-2">
                        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Sources</div>
                        {results.map((r, i) => (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                             className="block p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border border-zinc-100 dark:border-zinc-700">
                            <div className="text-xs font-medium text-brand-500 truncate">{r.title}</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">{new URL(r.url).hostname}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{r.content}</div>
                          </a>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                <div className={`flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {isUser && (
                    <button onClick={() => onEdit(msg)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer" title="编辑">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleCopy(msg.content)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer" title="复制">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {!isUser && (
                    <button onClick={() => onRegenerate(msg.id)} className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer" title="重新生成">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleDeleteMsg(msg.id)} className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer" title="删除">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      }}
      atBottomStateChange={atBottomStateChange}
      followOutput="smooth"
    />
  );
}
