'use client';

import { useState, useEffect, useCallback, useRef, useSyncExternalStore } from 'react';
import { useLang } from '@/context/LangContext';
import { useCarousel, useCarouselMobile, useHero } from '@/lib/siteData';

const DEFAULT_DURATION = 10;
const MAX_DURATION = 12;
const SWIPE_THRESHOLD = 40;
// Matches the site's own banner convention (1920x1200), used only until a
// slide's real image/video dimensions load in and replace it.
const FALLBACK_RATIO = 8 / 5;
// Same cutoff Nav/WorkGrid/About already use for "phone".
const MOBILE_QUERY = '(max-width: 639px)';
const NO_ITEMS: ReturnType<typeof useCarousel> = [];

function subscribeToMobileQuery(onChange: () => void): () => void {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/** Phone banners run entirely separate from desktop ones (admin-configured).
 *  `null` on the server and for the very first client snapshot — nothing
 *  renders meanwhile, so a phone never briefly downloads the desktop set
 *  (or the reverse) before swapping. */
function useIsMobile(): boolean | null {
  return useSyncExternalStore(
    subscribeToMobileQuery,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => null,
  );
}

export default function Hero() {
  const { t, lang } = useLang();
  const [current, setCurrent] = useState(0);
  const desktopItems = useCarousel();
  const mobileItems = useCarouselMobile();
  const isMobile = useIsMobile();
  // No mobile-specific banners configured yet in the panel: fall back to the
  // desktop set on phones too, rather than showing nothing. Once any are
  // added there, phones use only those — never the desktop ones.
  const items =
    isMobile === null ? NO_ITEMS : isMobile && mobileItems.length > 0 ? mobileItems : desktopItems;
  const hero = useHero();
  const ctaSlug = hero.ctaSlug;
  const tagline = hero.tagline?.[lang] || t.hero.tagline;
  const [readyVideos, setReadyVideos] = useState<Record<string, boolean>>({});
  // Each slide's own aspect ratio, read from its actual media once loaded —
  // the section resizes to match instead of cropping via object-cover.
  const [ratios, setRatios] = useState<Record<string, number>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const lastFrameTimes = useRef<Record<string, number>>({});
  const touchStartX = useRef<number | null>(null);

  // Some browsers pause/stall background videos after long tab throttling;
  // resume playback whenever the tab becomes visible again.
  useEffect(() => {
    const resumeAll = () => {
      if (document.visibilityState !== 'visible') return;
      Object.values(videoRefs.current).forEach((video) => {
        if (video && video.paused) video.play().catch(() => {});
      });
    };
    document.addEventListener('visibilitychange', resumeAll);
    return () => document.removeEventListener('visibilitychange', resumeAll);
  }, []);

  // Watchdog: a long-running looped video can freeze on a blank decoded frame
  // (readyState/playing stay fine but the picture stops updating) without ever
  // firing pause/stalled/error. Poll each video's currentTime and force a full
  // reload if it has not advanced since the last check while supposedly
  // playing. A video left paused is retried every tick too — onPause/onStalled
  // only get one retry each, so without this a failed retry left the banner
  // permanently blank.
  useEffect(() => {
    const watchdog = setInterval(() => {
      Object.entries(videoRefs.current).forEach(([id, video]) => {
        if (!video || video.ended) return;
        if (video.paused) {
          video.play().catch(() => {});
          return;
        }
        const last = lastFrameTimes.current[id];
        if (last !== undefined && last === video.currentTime) {
          video.load();
          video.play().catch(() => {});
        }
        lastFrameTimes.current[id] = video.currentTime;
      });
    }, 3000);
    return () => clearInterval(watchdog);
  }, []);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % items.length);
  }, [items.length]);

  const item = items[current] ?? items[0];
  const seconds = Math.min(
    item?.duration && item.duration > 0 ? item.duration : DEFAULT_DURATION,
    MAX_DURATION,
  );

  // Each banner stays on screen for its own configured duration, then advances.
  useEffect(() => {
    if (!items[current]) return;
    const timer = setTimeout(next, seconds * 1000);
    return () => clearTimeout(timer);
  }, [current, items, next, seconds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prev, next]);

  if (!item) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (deltaX <= -SWIPE_THRESHOLD) next();
    else if (deltaX >= SWIPE_THRESHOLD) prev();
  };

  const activeRatio = ratios[item.id] ?? FALLBACK_RATIO;

  return (
    <section
      // The nav is solid and sits in normal flow on a phone now (not
      // overlaid), so the banner needs pushed down by its height there;
      // margin rather than padding so it doesn't skew the aspect-ratio box.
      className="relative mt-24 w-full overflow-hidden bg-shell transition-[aspect-ratio] duration-700 ease-out sm:mt-0"
      style={{ aspectRatio: activeRatio }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* All banners stacked, crossfading between them. */}
      {items.map((slide, i) => (
        <div
          key={slide.id}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: i === current ? 1 : 0 }}
          aria-hidden={i !== current}
        >
          {slide.type === 'image' ? (
            <img
              ref={(el) => {
                // A cached image can already be complete by the time this ref
                // runs, so the onLoad below never fires — check synchronously too.
                if (el && el.complete && el.naturalHeight > 0) {
                  setRatios((r) => (r[slide.id] ? r : { ...r, [slide.id]: el.naturalWidth / el.naturalHeight }));
                }
              }}
              src={slide.src}
              alt={slide.alt}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalHeight > 0) {
                  setRatios((r) => ({ ...r, [slide.id]: img.naturalWidth / img.naturalHeight }));
                }
              }}
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              ref={(el) => {
                videoRefs.current[slide.id] = el;
                // A cached video can already hold its data by the time this ref
                // runs, so the loadeddata listener below never fires — without
                // this check the banner stays invisible despite playing.
                if (el && el.readyState >= 2) {
                  setReadyVideos((r) => (r[slide.id] ? r : { ...r, [slide.id]: true }));
                }
                if (el && el.videoHeight > 0) {
                  setRatios((r) => (r[slide.id] ? r : { ...r, [slide.id]: el.videoWidth / el.videoHeight }));
                }
              }}
              src={slide.src}
              autoPlay
              muted
              loop
              playsInline
              onLoadedData={() => setReadyVideos((r) => ({ ...r, [slide.id]: true }))}
              onLoadedMetadata={(e) => {
                const video = e.currentTarget;
                if (video.videoHeight > 0) {
                  setRatios((r) => ({ ...r, [slide.id]: video.videoWidth / video.videoHeight }));
                }
              }}
              onPause={(e) => e.currentTarget.play().catch(() => {})}
              onStalled={(e) => e.currentTarget.play().catch(() => {})}
              onError={(e) => {
                const video = e.currentTarget;
                video.load();
                video.play().catch(() => {});
              }}
              className="h-full w-full object-cover transition-opacity duration-500"
              style={{ opacity: readyVideos[slide.id] ? 1 : 0 }}
            />
          )}
        </div>
      ))}

      {/* Scrims: one under the header (tablet/desktop only — the nav sits in
          normal flow on a phone, not overlaid), one under the caption. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-44 bg-gradient-to-b from-ink/30 to-transparent sm:block" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/50 via-ink/12 to-transparent" />

      {/* Caption */}
      <div className="edge absolute inset-x-0 bottom-0 pb-14 sm:pb-16">
        <p className="eyebrow mb-1.5 text-paper/60" style={{ fontSize: '0.8125rem' }}>{tagline}</p>
        <a
          href={ctaSlug ? `/work/${ctaSlug}/` : '#work'}
          className="eyebrow wipe draw inline-flex items-center gap-4 text-paper/90 transition-colors hover:text-paper"
          style={{ fontSize: '0.75rem' }}
        >
          <span className="sm:hidden">{t.hero.subTaglineShort}</span>
          <span className="hidden sm:inline">{t.hero.subTagline}</span>
          <span aria-hidden>&#8594;</span>
        </a>
      </div>

      {/* Controls: one hairline per banner, filling as it plays. */}
      <div className="edge absolute inset-x-0 bottom-0 flex items-center gap-5 pb-7">
        <button onClick={prev} aria-label="Previous banner" className="text-paper/60 transition-colors hover:text-paper">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-1 items-center gap-2 sm:max-w-xs">
          {items.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => setCurrent(i)}
              aria-label={`Go to banner ${i + 1}`}
              className="h-3 flex-1 min-w-6 cursor-pointer"
            >
              <span className="block h-px w-full bg-paper/30">
                {i === current && (
                  <span
                    key={`${slide.id}-${current}`}
                    className="progress-fill block h-px w-full bg-paper"
                    style={{ animationDuration: `${seconds}s` }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>

        <button onClick={next} aria-label="Next banner" className="text-paper/60 transition-colors hover:text-paper">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <span className="eyebrow-sm tabular-nums text-paper/70">
          {String(current + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </span>
      </div>
    </section>
  );
}
