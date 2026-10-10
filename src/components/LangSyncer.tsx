'use client';

import { useEffect } from 'react';
import { useLang } from '@/context/LangContext';

export default function LangSyncer() {
  const { lang } = useLang();
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return null;
}
