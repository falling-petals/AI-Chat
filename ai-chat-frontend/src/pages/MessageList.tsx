import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Brain, File, FileText, FileSpreadsheet } from 'lucide-react';
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
          <img src={imgSrc} alt={file.originalName} className="max-w-sm max-h-64 rounded-lg object-cover border border-zinc-200 dark:border-zinc-700 hover:opacity-90 transition-opacity" loading="lazy" />
        ) : (
          <div className="w-32 h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
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
      className="inline-flex items-center gap-2 px-3 py-2 my-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
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
            <div className="px-7 py-2.5">
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
            {msg.role === 'user' ? (
              <div className="flex justify-end px-7 py-2.5 group">
                <div className="max-w-3xl">
                  {msg.files && msg.files.length > 0 && (
                    <div className="mb-2 flex flex-wrap justify-end gap-1">
                      {msg.files.map((file) => (
                        <FileAttachment key={file.id} file={file} />
                      ))}
                    </div>
                  )}
                  <div className="bg-[#ebf5ff] dark:bg-[#293652] rounded-lg px-4 py-2.5">
                    <div className="prose prose-base max-w-none text-zinc-800 dark:text-zinc-200">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ code: CodeBlock }}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end mt-1 text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(msg)} className="hover:text-zinc-600 dark:hover:text-zinc-300">编辑</button>
                    <button onClick={() => handleCopy(msg.content)} className="hover:text-zinc-600 dark:hover:text-zinc-300">复制</button>
                    <button onClick={() => handleDeleteMsg(msg.id)} className="hover:text-zinc-600 dark:hover:text-zinc-300">删除</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-start px-7 py-2.5 group">
                <div className="max-w-3xl">
                  {msg.thinking && (
                    <details className="mb-2">
                      <summary className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                        <Brain className="w-3.5 h-3.5" />
                        Thought
                      </summary>
                      <div className="mt-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700">
                        <div className="prose prose-base max-w-none">
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
                  <div className="bg-white/60 dark:bg-[#212121] rounded-lg px-4 py-2.5">
                    <div className="prose prose-base max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ code: CodeBlock }}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  {(() => {
                    const results = messageSearchResults[msg.id];
                    if (!results || results.length === 0) return null;
                    return (
                      <div className="mt-3 space-y-2 border-t border-zinc-100 dark:border-zinc-700 pt-2">
                        <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Sources</div>
                        {results.map((r, i) => (
                          <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                             className="block p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border border-zinc-100 dark:border-zinc-700">
                            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 truncate">{r.title}</div>
                            <div className="text-[10px] text-zinc-400 mt-0.5">{new URL(r.url).hostname}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{r.content}</div>
                          </a>
                        ))}
                      </div>
                    );
                  })()}
                  <div className="flex gap-3 mt-1 text-xs text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleCopy(msg.content)} className="hover:text-zinc-600 dark:hover:text-zinc-300">复制</button>
                    <button onClick={() => onRegenerate(msg.id)} className="hover:text-zinc-600 dark:hover:text-zinc-300">重新生成</button>
                    <button onClick={() => handleDeleteMsg(msg.id)} className="hover:text-zinc-600 dark:hover:text-zinc-300">删除</button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      }}
      atBottomStateChange={atBottomStateChange}
      followOutput="smooth"
    />
  );
}
