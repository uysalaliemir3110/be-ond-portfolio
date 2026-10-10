'use client';

import { useLang } from '@/context/LangContext';
import { useArchive } from '@/lib/siteData';
import CollectionCard, { type CardProject } from './CollectionCard';
import Reveal from './Reveal';

export default function WorkGrid() {
  const { t, lang } = useLang();
  const items = useArchive() as CardProject[];
  const shown = items.slice(0, 6);
  // The grid stays 2-up all the way to `lg` (not just `sm` — a landscape
  // phone is wider than `sm` but still 2 columns), so drop a trailing odd
  // card there too or it reappears alone once the screen is wide enough to
  // clear the `sm` cutoff but not wide enough for the 3-up layout.
  const twoUpHiddenFrom =
    shown.length >= 2 ? shown.length - (shown.length % 2) : shown.length;

  return (
    <section id="work" className="edge scroll-mt-24 pt-24 pb-12 sm:pt-32 sm:pb-36">
      <div className="mb-12 flex items-end justify-between gap-6 border-b border-line pb-5 sm:mb-16">
        <div>
          <h2 className="font-display text-4xl leading-none sm:text-6xl">{t.work.heading}</h2>
        </div>
        <a href="/collections" className="eyebrow wipe draw inline-block shrink-0 pb-1 text-ash transition-colors hover:text-ink">
          <span className="max-sm:hidden">{t.work.viewAll} &#8594;</span>
          <span className="hidden max-sm:inline">{t.work.viewAllShort} &#8594;</span>
        </a>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
        {shown.map((project, i) => (
          <Reveal
            key={project.id}
            delay={(i % 3) * 90}
            className={i >= twoUpHiddenFrom ? 'max-lg:hidden' : ''}
          >
            <CollectionCard project={project} lang={lang} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
