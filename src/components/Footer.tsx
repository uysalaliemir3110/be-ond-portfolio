'use client';

import { useLang } from '@/context/LangContext';
import Wordmark from './Wordmark';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="overflow-hidden bg-paper">
      {/* An oversized ghost signature, cropped by the viewport edges. */}
      <div className="edge pt-14 pb-2 sm:pt-20">
        <Wordmark
          className="font-display block w-full select-none text-center text-[clamp(3.25rem,17vw,15rem)] leading-[0.78] tracking-[-0.03em] text-shell"
          slashClassName="text-line"
          atelier
          atelierClassName="mt-1 sm:mt-3 w-full text-center font-sans text-[clamp(0.7rem,2vw,1.35rem)] font-normal tracking-[0.5em] text-shell"
        />
      </div>

      <div className="edge flex flex-wrap items-center justify-between gap-2 border-t border-line py-6">
        <p className="eyebrow-sm text-ash">
          &copy; {new Date().getFullYear()} BE/OND. {t.footer.rights}
        </p>
        <p className="eyebrow-sm text-ash">{t.footer.madeWith}</p>
      </div>
    </footer>
  );
}
