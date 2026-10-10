'use client';

import { useLang } from '@/context/LangContext';

/**
 * The thin dark band under the banner. Two identical halves scroll as one
 * track, so the loop meets itself with no visible seam.
 */
export default function Marquee() {
  const { t } = useLang();
  const words: string[] = t.marquee;
  const run = [...words, ...words, ...words, ...words];

  return (
    <div className="overflow-hidden border-y border-ink bg-ink py-3.5 text-paper">
      <div className="marquee-track">
        {[0, 1].map((half) => (
          <div key={half} className="flex shrink-0" aria-hidden={half === 1}>
            {run.map((word, i) => (
              <span key={`${half}-${i}`} className="eyebrow flex items-center whitespace-nowrap px-7 text-paper/80">
                {word}
                <span className="ml-7 text-ember">&#47;</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
