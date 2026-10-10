'use client';

import Link from 'next/link';
import { useLang } from '@/context/LangContext';
import Footer from './Footer';

export default function NotFoundView() {
  const { lang, t } = useLang();

  return (
    <main>
      <section className="edge flex min-h-[78svh] flex-col justify-center pt-32 pb-24">
        <p className="eyebrow-sm text-ash">404</p>
        <h1 className="font-display mt-5 max-w-[14ch] text-[clamp(2.5rem,8vw,6rem)] leading-[0.92]">
          {lang === 'tr' ? 'Bu sayfa yok.' : 'Nothing here.'}
        </h1>
        <Link href="/" className="eyebrow wipe draw mt-10 inline-block w-fit text-ash transition-colors hover:text-ink">
          &#8592; {t.archive.back}
        </Link>
      </section>
      <Footer />
    </main>
  );
}
