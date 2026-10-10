'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLang } from '@/context/LangContext';
import { useArchive } from '@/lib/siteData';
import Reveal from './Reveal';

type GalleryImage = { src: string; wide: boolean };

type Project = {
  id: string;
  slug: string;
  year: string | number;
  category: string;
  title: Record<string, string>;
  coverImage: string;
  gallery: GalleryImage[];
  featured: boolean;
};

export default function ProjectDetail({ project: initial }: { project: Project }) {
  const { lang, t } = useLang();
  const live = useArchive();
  // Prefer the live record for this collection so panel edits show without a rebuild.
  const project = (live as Project[]).find((p) => p.slug === initial.slug) ?? initial;

  const categoryLabel: Record<string, string> = {
    collection: t.work.filterCollection,
    textile: t.work.filterTextile,
    accessory: t.work.filterAccessory,
    workshop: t.work.filterWorkshop,
  };

  // A gallery entry can point at a file removed in the panel before the
  // deletion was saved (the file goes immediately, the record only on Kaydet).
  // Drop it from the grid on load failure instead of leaving a blank frame
  // with alt text sitting in the layout.
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const gallery = project.gallery.filter((image) => !broken.has(image.src));

  return (
    <article className="pb-24 sm:pb-32">
      <header className="edge pt-32 sm:pt-44">
        <Link href="/#work" className="eyebrow-sm wipe draw inline-block text-ash transition-colors hover:text-ink">
          &#8592; {t.archive.back}
        </Link>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-line pb-6 sm:mt-14">
          <h1 className="font-display text-[clamp(2.5rem,8vw,6.5rem)] leading-[0.9] tracking-[-0.015em]">
            {project.title[lang]}
          </h1>
          <div className="flex items-baseline gap-6 pb-1.5">
            <span className="eyebrow-sm text-ash">{categoryLabel[project.category] ?? project.category}</span>
            <span className="eyebrow-sm tabular-nums text-ink">{project.year}</span>
          </div>
        </div>
      </header>

      {gallery.length > 0 && (
        <div className="edge mt-8 sm:mt-12">
          {/* Frames marked "wide" in the panel run the full measure; the rest pair up. */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6">
            {gallery.map((image, i) => (
              <Reveal key={image.src} delay={(i % 2) * 90} className={image.wide ? 'col-span-2' : ''}>
                <div className="overflow-hidden bg-shell">
                  <img
                    src={image.src}
                    alt={`${project.title[lang]} — ${i + 1}`}
                    loading="lazy"
                    className="block h-auto w-full"
                    onError={() => setBroken((b) => new Set(b).add(image.src))}
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
