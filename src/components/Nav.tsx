'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLang } from '@/context/LangContext';
import Wordmark from './Wordmark';

export default function Nav() {
  const { t, toggleLang } = useLang();
  const pathname = usePathname();
  const isHome = pathname === '/';
  const base = isHome ? '' : '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The admin panel has its own header — no public nav there.
  if (pathname?.startsWith('/admin')) return null;

  // Over the homepage banner the bar is transparent and reversed out in paper;
  // everywhere else (and once scrolled) it sits on solid paper.
  const onImage = isHome && !scrolled;

  const sectionLinks = [
    { href: `${base}#work`, label: t.nav.work },
    { href: `${base}#about`, label: t.nav.about },
    { href: `${base}#contact`, label: t.nav.contact },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b border-line bg-paper/85 text-ink backdrop-blur-md transition-[background-color,border-color,color] duration-500 ${
        // A phone has no room to push the caption down, so the bar stays
        // solid there at all times; only from `sm` up does it go transparent
        // over the still-full-bleed hero. Text stays the same dark ink in
        // both states now, so no separate over-image color is needed.
        onImage ? 'sm:border-transparent sm:bg-transparent sm:backdrop-blur-none' : ''
      }`}
    >
      <div className="edge flex h-16 items-center justify-between sm:h-20">
        <Link href="/" aria-label="BE/OND Atelier" className="shrink-0">
          <Wordmark
            className="font-sans text-base font-medium tracking-[0.32em] sm:text-2xl"
            slashClassName="text-ember"
            atelier
            atelierClassName="mt-1 text-[0.5625rem] font-normal tracking-[0.3em] text-ash sm:text-xs"
          />
        </Link>

        <nav className="hidden items-center gap-10 sm:flex">
          {sectionLinks.map((l) => (
            <a key={l.href} href={l.href} className="eyebrow wipe draw inline-block opacity-80 transition-opacity hover:opacity-100" style={{ fontSize: '0.75rem' }}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5 sm:gap-7">
          <button
            onClick={toggleLang}
            aria-label="Toggle language"
            className="eyebrow wipe inline-block opacity-80 transition-opacity hover:opacity-100"
          >
            {t.nav.toggleLang}
          </button>
          <a
            href="https://www.instagram.com/be.ondofficial/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="opacity-80 transition-opacity hover:opacity-100"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round">
              <rect x="1.7" y="1.7" width="20.6" height="20.6" rx="6" />
              <circle cx="12.1" cy="12.2" r="5.45" />
              <circle cx="18.3" cy="5.9" r="0.95" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>

      {/* The section links do not fit beside the wordmark on a phone, so they
          get their own row rather than being hidden away. */}
      <div className="flex items-center justify-center gap-9 py-2.5 sm:hidden">
        {sectionLinks.map((l) => (
          <a key={l.href} href={l.href} className="eyebrow-sm opacity-75">
            {l.label}
          </a>
        ))}
      </div>
    </header>
  );
}
