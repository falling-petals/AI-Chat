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
    <div className="flex justify-start">
      <div className="max-w-[70%] rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 overflow-hidden">
        {thinking && (
          <details open className="border-b border-white/10">
            <summary className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[#6366F1] cursor-pointer select-none hover:bg-[#6366F1]/5 transition-colors">
              <Brain className="w-3.5 h-3.5" />
              {streaming && !content ? 'Thinking...' : 'Thought'}
            </summary>
            <div className="px-4 pb-3 pt-1 bg-[#6366F1]/[0.02]">
              <p className="text-sm text-[#475569] whitespace-pre-wrap leading-relaxed">{thinking}</p>
            </div>
          </details>
        )}
        {content ? (
          <div className="px-4 py-3 prose prose-sm max-w-none text-[#1E1B4B]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={{ code: CodeBlock }}>{content}</ReactMarkdown>
          </div>
        ) : streaming && !thinking && (
          <div className="px-4 py-4 flex items-center gap-1.5 text-[#6366F1]">
            <Brain className="w-4 h-4" />
            <span className="text-sm">Thinking</span>
            <span className="typing-dot">.</span>
            <span className="typing-dot animation-delay-200">.</span>
            <span className="typing-dot animation-delay-400">.</span>
          </div>
        )}
      </div>
    </div>
  );
}
