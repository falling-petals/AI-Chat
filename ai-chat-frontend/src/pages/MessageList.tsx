import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Brain, Pencil, Copy, Trash2, RefreshCw, File, FileText, FileSpreadsheet } from 'lucide-react';
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
          <img src={imgSrc} alt={file.originalName} className="max-w-sm max-h-64 rounded-lg object-cover border border-gray-200 dark:border-slate-700 hover:opacity-90 transition-opacity" loading="lazy" />
        ) : (
          <div className="w-32 h-24 rounded-lg bg-gray-100 dark:bg-slate-800 animate-pulse" />
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
      className="inline-flex items-center gap-2 px-3 py-2 my-1 rounded-lg bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-sm text-gray-700 dark:text-slate-300 transition-colors"
    >
      <FileIcon className="w-4 h-4" />
      <span className="truncate max-w-[200px]">{file.originalName}</span>
    </a>
  );
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-2 px-4">
      <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
      <span className="text-xs text-gray-400 dark:text-slate-500 font-medium shrink-0">{label}</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
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

  const handleCopy = async (msg: MessageVO) => {
    try {
      await navigator.clipboard.writeText(msg.content);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定删除这条消息？')) return;
    await onDelete(id);
  };

  const userBtnClass = 'p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all cursor-pointer';
  const asstBtnClass = 'p-1 rounded-lg text-[#6366F1]/60 hover:text-[#6366F1] hover:bg-[#6366F1]/10 transition-all cursor-pointer';

  return (
    <Virtuoso
      ref={virtuosoRef}
      className="flex-1"
      data={allItems}
      itemContent={(index, item) => {
        if ('_stream' in item) {
          return (
            <div className="px-4 mb-4">
              <StreamingMessage content={item.content} thinking={item.thinking} streaming={streaming} />
            </div>
          );
        }
        const msg = item;
        const prev = index > 0 ? allItems[index - 1] : undefined;
        const prevMsg = prev && !('_stream' in prev) ? prev as MessageVO : undefined;
        const showDateLabel = index === 0 || msg.dateLabel !== prevMsg?.dateLabel;
        return (
          <>
            {showDateLabel && <DateDivider label={msg.dateLabel ?? '更早'} />}
            <div className={`flex mb-4 px-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`group relative max-w-[70%] px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-white/20 dark:border-slate-700/50 text-[#1E1B4B] dark:text-slate-100'
              }`}>
                {msg.thinking && (
                  <details className="mb-2">
                    <summary className="flex items-center gap-1.5 text-xs font-medium text-[#6366F1] cursor-pointer select-none hover:text-[#4F46E5] transition-colors">
                      <Brain className="w-3.5 h-3.5" />
                      Thought
                    </summary>
                    <div className="mt-2 pl-3 border-l-2 border-[#6366F1]/20">
                      <div className="prose prose-sm max-w-none text-[#475569] dark:text-slate-400">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ code: CodeBlock }}>{msg.thinking}</ReactMarkdown>
                      </div>
                    </div>
                  </details>
                )}
                {msg.files && msg.files.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {msg.files.map((file) => (
                      <FileAttachment key={file.id} file={file} />
                    ))}
                  </div>
                )}
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ code: CodeBlock }}>{msg.content}</ReactMarkdown>
                </div>
                {msg.role === 'assistant' && (() => {
                  const results = messageSearchResults[msg.id];
                  if (!results || results.length === 0) return null;
                  return (
                    <div className="mt-3 space-y-2 border-t border-gray-100 dark:border-slate-700 pt-2">
                      <div className="text-[10px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider">Sources</div>
                      {results.map((r, i) => (
                        <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                           className="block p-2 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors border border-gray-100 dark:border-slate-700">
                          <div className="text-xs font-medium text-[#6366F1] truncate">{r.title}</div>
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{new URL(r.url).hostname}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{r.content}</div>
                        </a>
                      ))}
                    </div>
                  );
                })()}
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {msg.role === 'user' && (
                    <button onClick={() => onEdit(msg)} className={userBtnClass} title="编辑">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleCopy(msg)} className={msg.role === 'user' ? userBtnClass : asstBtnClass} title="复制">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {msg.role === 'assistant' && (
                    <button onClick={() => onRegenerate(msg.id)} className={asstBtnClass} title="重新生成">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(msg.id)} className={msg.role === 'user' ? userBtnClass : asstBtnClass} title="删除">
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
