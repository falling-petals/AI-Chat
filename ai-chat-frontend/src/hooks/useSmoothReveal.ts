import { useState, useEffect, useRef } from 'react';

const DEFAULT_CPS = 3;

export function useSmoothReveal(content: string, isAnimating: boolean, charsPerFrame = DEFAULT_CPS): string {
  const [revealed, setRevealed] = useState('');
  const posRef = useRef(0);
  const rafRef = useRef(0);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (!isAnimating) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      setRevealed(content);
      return;
    }

    posRef.current = 0;
    setRevealed('');

    const tick = () => {
      const full = contentRef.current;
      const pos = posRef.current;

      if (pos < full.length) {
        const nextPos = Math.min(full.length, pos + charsPerFrame);
        posRef.current = nextPos;
        setRevealed(full.slice(0, nextPos));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [isAnimating]);

  return revealed;
}
