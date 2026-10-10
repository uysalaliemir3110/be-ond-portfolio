'use client';

import Link from 'next/link';
import { useLang } from '@/context/LangContext';
import { useArchive } from '@/lib/siteData';
import CollectionCard, { type CardProject } from './CollectionCard';
import Reveal from './Reveal';

export default function CollectionsGridFull() {
  const { t, lang } = useLang();
  const items = useArchive() as CardProject[];

  return (
    <section className="edge pt-32 pb-28 sm:pt-44 sm:pb-36">
      <div className="mb-12 border-b border-line pb-5 sm:mb-16">
        <Link href="/#work" className="eyebrow-sm wipe draw mb-8 inline-block text-ash transition-colors hover:text-ink sm:mb-10">
          &#8592; {t.archive.back}
        </Link>
        <div className="flex items-end justify-between gap-6">
          <h1 className="font-display text-4xl leading-none sm:text-6xl">{t.work.heading}</h1>
          <span className="eyebrow-sm shrink-0 pb-1 tabular-nums text-ash">
            {String(items.length).padStart(2, '0')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
        {items.map((project, i) => (
          <Reveal key={project.id} delay={(i % 3) * 90}>
            <CollectionCard project={project} lang={lang} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
