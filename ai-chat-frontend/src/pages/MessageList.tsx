import { useEffect, useState, useMemo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Streamdown } from 'streamdown';
import { Sparkles, File, FileText, FileSpreadsheet, Pencil, Copy, Trash2, RefreshCw } from 'lucide-react';
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
      className="inline-flex items-center gap-2 px-3 py-1 my-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 transition-colors"
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

  const allItems = useMemo<ListItem[]>(() => {
    if (streaming || streamContent || thinkingContent) {
      return [...messages, { _stream: true as const, content: streamContent, thinking: thinkingContent }];
    }
    return messages;
  }, [messages, streaming, streamContent, thinkingContent]);

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
      className="flex-1"
      data={allItems}
      itemContent={(index, item) => {
        if ('_stream' in item) {
          return (
            <div className="flex justify-start px-4 md:px-7 py-1">
              <div className="max-w-2xl min-w-0 w-full">
                <StreamingMessage content={item.content} thinking={item.thinking} streaming={streaming} />
              </div>
            </div>
          );
        }
        const msg = item;
        const prev = index > 0 ? allItems[index - 1] : undefined;
        const userMsgs = messages.filter(m => m.role === 'user');
        const aiMsgs = messages.filter(m => m.role === 'assistant');
        const lastUserMsg = userMsgs[userMsgs.length - 1];
        const lastAiMsg = aiMsgs[aiMsgs.length - 1];
        const isLastUserMsg = msg.role === 'user' && lastUserMsg?.id === msg.id;
        const isLastAiMsg = msg.role === 'assistant' && lastAiMsg?.id === msg.id;
        const prevMsg = prev && !('_stream' in prev) ? prev as MessageVO : undefined;
        const showDateLabel = index === 0 || msg.dateLabel !== prevMsg?.dateLabel;
        return (
          <>
            {showDateLabel && <DateDivider label={msg.dateLabel ?? '更早'} />}
            {msg.role === 'user' ? (
              <div className="flex justify-end px-4 md:px-7 py-1">
                <div className="max-w-2xl min-w-0 w-full">
                  {msg.files && msg.files.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {msg.files.map((file) => (
                        <FileAttachment key={file.id} file={file} />
                      ))}
                    </div>
                  )}
                  <div className="bg-[#ebf5ff] dark:bg-[#293652] rounded-xl px-4 py-2 w-fit max-w-full">
                    <div className="prose prose-base max-w-none">
                      <Streamdown components={{ code: CodeBlock }} controls={{ table: { fullscreen: false } }}>{msg.content}</Streamdown>
                    </div>
                  </div>
                  <div className="flex gap-1 mt-1 text-zinc-400">
                    {isLastUserMsg && (
                    <button onClick={() => onEdit(msg)} title="编辑" className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    )}
                    <button onClick={() => handleCopy(msg.content)} title="复制" className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeleteMsg(msg.id)} title="删除" className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-start px-4 md:px-7 py-1">
                <div className="max-w-2xl min-w-0 w-full">
                  {msg.thinking && (
                    <details className="mb-2 pl-4">
                      <summary className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
                        <Sparkles className="w-3.5 h-3.5" />
                        Thought
                      </summary>
                      <div className="mt-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700">
                        <div className="prose prose-base max-w-none">
                          <Streamdown components={{ code: CodeBlock }} controls={{ table: { fullscreen: false } }}>{msg.thinking}</Streamdown>
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
                  <div className="bg-white/60 dark:bg-[#212121] rounded-xl px-4 py-2">
                    <div className="prose prose-base max-w-none">
                      <Streamdown components={{ code: CodeBlock }} controls={{ table: { fullscreen: false } }}>{msg.content}</Streamdown>
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
                  <div className="flex gap-1 mt-1 pl-4 text-zinc-400">
                    <button onClick={() => handleCopy(msg.content)} title="复制" className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {isLastAiMsg && (
                    <button onClick={() => onRegenerate(msg.id)} title="重新生成" className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    )}
                    <button onClick={() => handleDeleteMsg(msg.id)} title="删除" className="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      }}
      followOutput="smooth"
    />
  );
}
