import { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface Props {
  className?: string;
  children?: React.ReactNode;
  node?: unknown;
}

export default function CodeBlock({ className, children }: Props) {
  const code = String(children);
  if (!className?.startsWith('language-') && !code.includes('\n')) {
    return <code className={className}>{code.replace(/^`|`$/g, '')}</code>;
  }
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const trimmedCode = code.replace(/\n$/, '');

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trimmedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore clipboard errors
    }
    }, [trimmedCode]);

  return (
    <div className="relative group">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <SyntaxHighlighter
        style={oneDark}
        language={lang || 'text'}
        PreTag="div"
        customStyle={{
          borderRadius: 10,
          padding: '1rem 1.25rem',
          fontSize: '0.9375rem',
          margin: '0.75em 0',
        }}
      >
        {trimmedCode}
      </SyntaxHighlighter>
    </div>
  );
}
