import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Brain } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';

interface StreamingMessageProps {
  content: string;
  thinking: string;
  streaming: boolean;
}

export default function StreamingMessage({ content, thinking, streaming }: StreamingMessageProps) {
  if (!streaming && !content && !thinking) return null;

  return (
    <div>
      {thinking && (
        <details open className="mb-2">
          <summary className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            <Brain className="w-3.5 h-3.5" />
            {streaming && !content ? 'Thinking...' : 'Thought'}
          </summary>
          <div className="pb-2 pt-1">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">{thinking}</p>
          </div>
        </details>
      )}
      {content ? (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ code: CodeBlock }}>{content}</ReactMarkdown>
        </div>
      ) : streaming && !thinking && (
        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
          <Brain className="w-4 h-4" />
          <span className="text-sm">Thinking</span>
          <span className="typing-dot">.</span>
          <span className="typing-dot animation-delay-200">.</span>
          <span className="typing-dot animation-delay-400">.</span>
        </div>
      )}
    </div>
  );
}
