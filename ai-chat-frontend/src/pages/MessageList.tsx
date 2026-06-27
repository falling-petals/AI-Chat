import { useEffect, useRef, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain, Pencil, Copy, Trash2, RefreshCw } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';
import type { MessageVO } from '../types';

interface MessageListProps {
  messages: MessageVO[];
  onEdit: (msg: MessageVO) => void;
  onDelete: (id: number) => Promise<void>;
  onRegenerate: (messageId: number) => void;
}

export default function MessageList({ messages, onEdit, onDelete, onRegenerate }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const groups = useMemo(() => {
    const result: { label: string; messages: MessageVO[] }[] = [];
    for (const msg of messages) {
      const label = msg.dateLabel ?? '更早';
      const last = result[result.length - 1];
      if (last && last.label === label) {
        last.messages.push(msg);
      } else {
        result.push({ label, messages: [msg] });
      }
    }
    return result;
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="flex items-center gap-3 mb-3 mt-2">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium shrink-0">{group.label}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          {group.messages.map((msg) => (
            <div key={msg.id} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`group relative max-w-[70%] px-4 py-3 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-[#6366F1] text-white'
                  : 'bg-white/80 backdrop-blur-sm border border-white/20 text-[#1E1B4B]'
              }`}>
                {msg.thinking && (
                  <details className="mb-2">
                    <summary className="flex items-center gap-1.5 text-xs font-medium text-[#6366F1] cursor-pointer select-none hover:text-[#4F46E5] transition-colors">
                      <Brain className="w-3.5 h-3.5" />
                      Thought
                    </summary>
                    <div className="mt-2 pl-3 border-l-2 border-[#6366F1]/20">
                      <div className="prose prose-sm max-w-none text-[#475569]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>{msg.thinking}</ReactMarkdown>
                      </div>
                    </div>
                  </details>
                )}
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code: CodeBlock }}>{msg.content}</ReactMarkdown>
                </div>
                {/* Action buttons */}
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
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
