'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import tr from '@/locales/tr';
import en from '@/locales/en';

type Lang = 'tr' | 'en';

interface LangContextValue {
  lang: Lang;
  t: typeof tr;
  toggleLang: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const toggleLang = () => setLang(prev => (prev === 'tr' ? 'en' : 'tr'));

  return (
    <LangContext.Provider value={{ lang, t: lang === 'tr' ? tr : en, toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
