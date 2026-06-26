import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export default function CodeBlock({ className, children }: Props) {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const code = String(children).replace(/\n$/, '');
  return (
    <SyntaxHighlighter
      style={oneDark}
      language={lang || 'text'}
      PreTag="div"
      customStyle={{
        borderRadius: 10,
        padding: '1rem 1.25rem',
        fontSize: '0.8125rem',
        margin: '0.75em 0',
      }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
