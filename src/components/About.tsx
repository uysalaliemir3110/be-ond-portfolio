'use client';

import { useLang } from '@/context/LangContext';
import { useAbout } from '@/lib/siteData';
import Reveal from './Reveal';

export default function About() {
  const { lang } = useLang();
  const about = useAbout();
  const images = about.images ?? [];
  // Phones show two photos per row; hide a trailing odd photo so no row is left
  // half empty (3 photos -> show 2). Wider screens still show them all.
  const mobileHiddenFrom =
    images.length >= 2 ? images.length - (images.length % 2) : images.length;
  const paragraphs = (about.body?.[lang] ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <section id="about" className="edge scroll-mt-24 border-t border-line pt-12 pb-24 sm:py-36">
      <div className="grid gap-x-10 gap-y-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="font-display text-4xl leading-none sm:text-6xl lg:sticky lg:top-32">
            {about.heading?.[lang]}
          </h2>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          {/* The opening line is set large; the rest settles into body size. */}
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className={
                i === 0
                  ? 'text-[1.35rem] leading-[1.5] tracking-[-0.01em] text-ink sm:text-[1.6rem]'
                  : 'mt-7 max-w-xl text-base leading-[1.9] text-ink/70'
              }
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      {images.length > 0 && (
        <div className="mt-20 grid grid-cols-2 gap-3 sm:mt-28 sm:grid-cols-3 sm:gap-6">
          {images.map((img, i) => (
            <Reveal
              key={i}
              delay={(i % 3) * 110}
              className={i >= mobileHiddenFrom ? 'max-sm:hidden' : ''}
            >
              <div className="aspect-[3/4] overflow-hidden bg-shell">
                <img
                  src={img.src}
                  alt={img.alt || ''}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0';
                  }}
                />
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
