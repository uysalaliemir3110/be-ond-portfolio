'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type State = 'hidden' | 'instant' | 'revealed';

/**
 * Fades and lifts its children in the first time they scroll into view.
 *
 * The wrapper starts hidden, so it must never be left waiting on an observer
 * that will not run: without IntersectionObserver the content is shown
 * outright, and a visitor who asked for reduced motion gets it with no
 * transition at all.
 */
export default function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>('hidden');

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      // Deferred a frame rather than set here, so this does not cascade a
      // second render synchronously out of the effect body.
      const frame = requestAnimationFrame(() => setState('instant'));
      return () => cancelAnimationFrame(frame);
    }

    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('revealed');
          io.disconnect();
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const shown = state !== 'hidden';
  const animated = state !== 'instant';

  return (
    <div
      ref={ref}
      style={animated && shown ? { transitionDelay: `${delay}ms` } : undefined}
      className={`${
        animated ? 'transition-[opacity,transform] duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]' : ''
      } ${shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'} ${className}`}
    >
      {children}
    </div>
  );
}
