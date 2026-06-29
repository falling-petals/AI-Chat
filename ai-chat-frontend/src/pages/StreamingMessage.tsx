import { Streamdown } from 'streamdown';
import { Sparkles } from 'lucide-react';
import { useSmoothReveal } from '../hooks/useSmoothReveal';
import CodeBlock from '../components/CodeBlock';

interface StreamingMessageProps {
  content: string;
  thinking: string;
  streaming: boolean;
}

export default function StreamingMessage({ content, thinking, streaming }: StreamingMessageProps) {
  const displayContent = useSmoothReveal(content, streaming);
  if (!streaming && !content && !thinking) return null;

  return (
    <div className="bg-white/60 dark:bg-[#212121] rounded-xl px-4 py-2">
      {thinking && (
        <details open className="mb-2">
          <summary className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-300 cursor-pointer select-none hover:text-zinc-600 dark:hover:text-zinc-400 transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            {streaming && !content ? 'Thinking...' : 'Thought'}
          </summary>
          <div className="pb-2 pt-1 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700">
            <div className="prose prose-sm max-w-none">
              <Streamdown components={{ code: CodeBlock }} controls={{ table: { fullscreen: false } }}>{thinking}</Streamdown>
            </div>
          </div>
        </details>
      )}
      {content ? (
        <div className="prose prose-base max-w-none">
          <Streamdown components={{ code: CodeBlock }} controls={{ table: { fullscreen: false } }}>{displayContent}</Streamdown>
        </div>
      ) : streaming && !thinking && (
        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-300">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm">Thinking</span>
          <span className="typing-dot">.</span>
          <span className="typing-dot animation-delay-200">.</span>
          <span className="typing-dot animation-delay-400">.</span>
        </div>
      )}
    </div>
  );
}
