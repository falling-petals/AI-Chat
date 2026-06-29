import { useState, useEffect, useRef } from 'react';

export function useSmoothReveal(content: string, isAnimating: boolean): string {
  const [revealed, setRevealed] = useState('');
  const posRef = useRef(0);
  const rafRef = useRef(0);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (!isAnimating) {
      cancelAnimationFrame(rafRef.current);
      setRevealed(content);
      return;
    }

    posRef.current = 0;
    setRevealed('');

    const tick = () => {
      const full = contentRef.current;
      const pos = posRef.current;

      if (pos < full.length) {
        posRef.current = pos + 1;
        setRevealed(full.slice(0, pos + 1));
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafRef.current);
  }, [isAnimating]);

  return revealed;
}
