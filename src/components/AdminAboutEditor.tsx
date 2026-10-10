'use client';

import { useEffect, useState } from 'react';
import aboutDefault from '@/data/about';
import MediaPickerInline from './MediaPickerInline';
import { loadData, saveData, deleteFile } from '@/lib/api';

type AboutImage = { id: string; src: string; alt: string };
type AboutData = {
  heading: { tr: string; en: string };
  body: { tr: string; en: string };
  images: AboutImage[];
};

export default function AdminAboutEditor() {
  const [about, setAbout] = useState<AboutData>(aboutDefault as AboutData);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData<AboutData>('about').then((data) => {
      if (data) setAbout({ ...data, images: data.images ?? [] });
    });
  }, []);

  const setHeading = (lang: 'tr' | 'en', v: string) =>
    setAbout((a) => ({ ...a, heading: { ...a.heading, [lang]: v } }));
  const setBody = (lang: 'tr' | 'en', v: string) =>
    setAbout((a) => ({ ...a, body: { ...a.body, [lang]: v } }));

  const updateImage = (id: string, updates: Partial<AboutImage>) =>
    setAbout((a) => ({
      ...a,
      images: a.images.map((im) => (im.id === id ? { ...im, ...updates } : im)),
    }));

  const addImage = () => {
    const id = `about-${Date.now()}`;
    setAbout((a) => ({ ...a, images: [...a.images, { id, src: `/about/${id}.jpg`, alt: '' }] }));
  };

  const deleteImage = (id: string) => {
    if (!confirm('Bu fotoğraf sunucudan kalıcı olarak silinsin mi?')) return;
    const image = about.images.find((im) => im.id === id);
    if (image) {
      deleteFile(image.src).catch(() => {
        // Dosya silinemese bile listeden kaldırmayı engelleme.
      });
    }
    setAbout((a) => ({ ...a, images: a.images.filter((im) => im.id !== id) }));
  };

  const moveImage = (id: string, dir: -1 | 1) => {
    setAbout((a) => {
      const idx = a.images.findIndex((im) => im.id === id);
      const next = idx + dir;
      if (next < 0 || next >= a.images.length) return a;
      const images = [...a.images];
      [images[idx], images[next]] = [images[next], images[idx]];
      return { ...a, images };
    });
  };

  const save = async () => {
    setStatus('saving');
    setError('');
    try {
      await saveData('about', about);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Kaydetme başarısız');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-3xl leading-none">Hakkında Bölümü</h3>
        <div className="flex items-center gap-3">
          {status === 'saved' && <span className="eyebrow-sm text-ink">✓ Kaydedildi</span>}
          {status === 'error' && <span className="eyebrow-sm text-ember">{error}</span>}
          <button onClick={save} disabled={status === 'saving'}
            className="eyebrow bg-ink px-6 py-3 text-paper transition-colors hover:bg-ink/85 disabled:opacity-50">
            {status === 'saving' ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Metin alanları */}
      <div className="border border-line p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="eyebrow-sm mb-3 block text-ash">Başlık (TR)</label>
            <input type="text" value={about.heading.tr} onChange={(e) => setHeading('tr', e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink" />
          </div>
          <div>
            <label className="eyebrow-sm mb-3 block text-ash">Başlık (EN)</label>
            <input type="text" value={about.heading.en} onChange={(e) => setHeading('en', e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="eyebrow-sm mb-3 block text-ash">Metin (TR)</label>
            <textarea rows={8} value={about.body.tr} onChange={(e) => setBody('tr', e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink leading-relaxed" />
          </div>
          <div>
            <label className="eyebrow-sm mb-3 block text-ash">Metin (EN)</label>
            <textarea rows={8} value={about.body.en} onChange={(e) => setBody('en', e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink leading-relaxed" />
          </div>
        </div>
        <p className="text-[9px] text-ash">Paragraf ayırmak için aralarında boş bir satır (iki kez Enter) bırakın.</p>
      </div>

      {/* Fotoğraflar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="eyebrow text-ash">Fotoğraflar</h4>
          <button onClick={addImage} className="eyebrow border border-line px-5 py-3 transition-colors hover:border-ink">
            + Fotoğraf Ekle
          </button>
        </div>

        {about.images.length === 0 && (
          <p className="text-[11px] text-ash">Henüz fotoğraf yok. &quot;+ Fotoğraf Ekle&quot; ile ekleyin.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {about.images.map((img, index) => (
            <div key={img.id} className="border border-line p-3 space-y-2.5">
              <MediaPickerInline
                currentSrc={img.src}
                targetPath={`/about/${img.id}.jpg`}
                accept="image/*"
                aspect="aspect-[4/5]"
                onPathChange={(path) => updateImage(img.id, { src: path })}
              />
              <input type="text" placeholder="Açıklama (alt text)" value={img.alt}
                onChange={(e) => updateImage(img.id, { alt: e.target.value })}
                className="w-full border border-line bg-transparent px-2 py-2 text-xs outline-none transition-colors focus:border-ink" />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button onClick={() => moveImage(img.id, -1)} disabled={index === 0}
                    className="border border-line px-3 py-2 text-[10px] transition-colors hover:border-ink disabled:opacity-30">↑</button>
                  <button onClick={() => moveImage(img.id, 1)} disabled={index === about.images.length - 1}
                    className="border border-line px-3 py-2 text-[10px] transition-colors hover:border-ink disabled:opacity-30">↓</button>
                </div>
                <button onClick={() => deleteImage(img.id)}
                  className="eyebrow-sm border border-line px-3 py-2 transition-colors hover:border-ember hover:text-ember">
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-ash">
        Değişiklikler yalnızca <strong>Kaydet</strong>&apos;e bastığınızda siteye yansır.
      </p>
    </div>
  );
}
