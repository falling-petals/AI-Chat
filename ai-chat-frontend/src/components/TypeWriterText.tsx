import { useState, useEffect } from 'react';

interface Props {
  text: string;
  speed?: number;
}

export default function TypeWriterText({ text, speed = 60 }: Props) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (displayed.length < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(text.slice(0, displayed.length + 1));
      }, speed);
      return () => clearTimeout(timer);
    }
    setDone(true);
  }, [displayed, text, speed]);

  return (
    <span>
      {displayed}
      <span className={`inline-block w-[2px] h-[1em] ml-0.5 align-middle bg-zinc-400 dark:bg-zinc-500 ${done ? 'animate-pulse' : 'animate-ping'}`} />
    </span>
  );
}
