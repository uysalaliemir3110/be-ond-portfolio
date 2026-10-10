'use client';

import Link from 'next/link';

export type CardProject = {
  id: string;
  slug: string;
  title: Record<string, string>;
  year: string | number;
  category: string;
  coverImage: string;
};

/**
 * One collection in a grid: the image, then a hairline with the name and the
 * season sitting on it. Shared by the homepage and the full index.
 */
export default function CollectionCard({
  project,
  lang,
}: {
  project: CardProject;
  lang: string;
}) {
  return (
    <Link href={`/work/${project.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden bg-shell max-sm:aspect-[4/5]">
        <img
          src={project.coverImage}
          alt={project.title[lang]}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.opacity = '0';
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-ink/0 transition-colors duration-700 group-hover:bg-ink/10" />
      </div>

      <div className="mt-4 border-t border-line pt-3 transition-colors duration-500 group-hover:border-ink sm:mt-5 sm:pt-3.5">
        <div className="flex items-baseline gap-3 sm:gap-4">
          <h3 className="font-display flex-1 truncate text-lg leading-none sm:text-2xl">
            {project.title[lang]}
          </h3>
          {/* At two-up on a phone the season will not fit beside the name, so
              it drops to its own line instead of truncating the title. */}
          <span className="eyebrow-sm hidden shrink-0 text-ash sm:block" style={{ fontSize: '0.8125rem' }}>
            {project.year}
          </span>
        </div>
        <span className="eyebrow-sm mt-2 block text-ash sm:hidden" style={{ fontSize: '0.75rem' }}>
          {project.year}
        </span>
      </div>
    </Link>
  );
}
