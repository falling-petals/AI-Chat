import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Brain, Bot } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';

interface StreamingMessageProps {
  content: string;
  thinking: string;
  streaming: boolean;
}

export default function StreamingMessage({ content, thinking, streaming }: StreamingMessageProps) {
  if (!streaming && !content && !thinking) return null;

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
      </div>
      <div className="flex-1 min-w-0 max-w-[800px]">
        <div className="rounded-2xl px-4 py-3 bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-bl-md overflow-hidden">
          {thinking && (
            <details open className="border-b border-zinc-100 dark:border-zinc-700">
              <summary className="flex items-center gap-1.5 px-1 py-2 text-xs font-medium text-brand-500 cursor-pointer select-none hover:text-brand-600 transition-colors">
                <Brain className="w-3.5 h-3.5" />
                {streaming && !content ? 'Thinking...' : 'Thought'}
              </summary>
              <div className="pb-2 pt-1">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{thinking}</p>
              </div>
            </details>
          )}
          {content ? (
            <div className="pt-2 prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ code: CodeBlock }}>{content}</ReactMarkdown>
            </div>
          ) : streaming && !thinking && (
            <div className="py-2 flex items-center gap-1.5 text-brand-500">
              <Brain className="w-4 h-4" />
              <span className="text-sm">Thinking</span>
              <span className="typing-dot">.</span>
              <span className="typing-dot animation-delay-200">.</span>
              <span className="typing-dot animation-delay-400">.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
