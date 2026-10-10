'use client';

import { useEffect, useState } from 'react';
import archiveDefault from '@/data/archive';
import carouselDefault from '@/data/carousel';
import carouselMobileDefault from '@/data/carouselMobile';
import heroDefault from '@/data/hero';
import aboutDefault from '@/data/about';

/**
 * Herkese açık sitenin canlı veriyi okuması için hook'lar.
 * Önce paketlenmiş varsayılanla render eder (SSG ile uyumlu), sonra
 * sunucudaki /data/*.json güncel veriyi getirip değiştirir.
 */

async function fetchLive<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return fallback;
    const data = await res.json();
    // Boş dizi geçerli bir cevaptır: yönetim panelinden her şey silindiyse
    // paketlenmiş varsayılana dönmemeliyiz, yoksa silme işlemi geri alınmış gibi görünür.
    if (Array.isArray(data)) return data as T;
    return fallback;
  } catch {
    return fallback;
  }
}

async function fetchLiveObject<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return fallback;
    const data = await res.json();
    if (data && typeof data === 'object' && !Array.isArray(data)) return data as T;
    return fallback;
  } catch {
    return fallback;
  }
}

export function useCarousel() {
  const [items, setItems] = useState(carouselDefault);
  useEffect(() => {
    fetchLive('/data/carousel.json', carouselDefault).then(setItems);
  }, []);
  return items;
}

/** The phone-only banner set, edited separately in the admin panel. */
export function useCarouselMobile() {
  const [items, setItems] = useState(carouselMobileDefault);
  useEffect(() => {
    fetchLive('/data/carouselMobile.json', carouselMobileDefault).then(setItems);
  }, []);
  return items;
}

export function useArchive() {
  const [items, setItems] = useState(archiveDefault);
  useEffect(() => {
    fetchLive('/data/archive.json', archiveDefault).then(setItems);
  }, []);
  return items;
}

export function useHero() {
  const [settings, setSettings] = useState(heroDefault);
  useEffect(() => {
    fetchLiveObject('/data/hero.json', heroDefault).then(setSettings);
  }, []);
  return settings;
}

export function useAbout() {
  const [data, setData] = useState(aboutDefault);
  useEffect(() => {
    fetchLiveObject('/data/about.json', aboutDefault).then(setData);
  }, []);
  return data;
}
