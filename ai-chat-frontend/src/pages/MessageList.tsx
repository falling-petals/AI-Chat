import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[70%] px-4 py-3 rounded-2xl ${
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
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
