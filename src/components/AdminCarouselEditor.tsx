'use client';

import { useEffect, useState, type DragEvent } from 'react';
import carouselDefault from '@/data/carousel';
import carouselMobileDefault from '@/data/carouselMobile';
import archiveDefault from '@/data/archive';
import heroDefault from '@/data/hero';
import MediaPickerInline from './MediaPickerInline';
import { loadData, saveData, deleteFile } from '@/lib/api';
import { reorder } from '@/lib/reorder';

type CarouselItem = typeof carouselDefault[0];
type ArchiveItem = typeof archiveDefault[0];
type HeroSettings = typeof heroDefault;

/**
 * One list of banners — desktop and mobile each get their own instance of
 * this, completely independent (own ids, own files, own order). A phone
 * only ever plays the mobile list; it never falls through to a desktop-only
 * banner once the mobile list has at least one in it.
 */
function BannerList({
  items,
  onChange,
  idPrefix,
}: {
  items: CarouselItem[];
  onChange: (items: CarouselItem[]) => void;
  idPrefix: string;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const updateItem = (id: string, updates: Partial<CarouselItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteItem = (id: string) => {
    if (!confirm('Bu banner ve medyası sunucudan kalıcı olarak silinsin mi?')) return;
    const item = items.find((it) => it.id === id);
    if (item?.src) {
      deleteFile(item.src).catch(() => {
        // Medya silinemese bile banner'ı listeden kaldır.
      });
    }
    onChange(items.filter((it) => it.id !== id));
  };

  const handleDragStart = (e: DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDragIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    onChange(reorder(items, dragIndex, index));
    setDragIndex(null);
  };

  const addItem = () => {
    // A count-based id collides with any existing id once the list has gaps —
    // it did here, and because the banner's filename is the id, the "new"
    // upload silently overwrote an existing banner's file. Timestamp-based ids
    // match how About photos and new collections are already named elsewhere.
    const newId = `${idPrefix}-${Date.now()}`;
    const newItem: CarouselItem = {
      id: newId,
      type: 'image',
      src: `/carousel/${newId}.jpg`,
      alt: '',
      tagline: { tr: '', en: '' },
      subTagline: { tr: '', en: '' },
      duration: 10,
    };
    onChange([...items, newItem]);
    setEditing(newId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-ash">
          Tutamaçtan (⠿) sürükleyip bırakarak sırasını değiştirebilirsiniz — slider bu sırayla döner (sıralamayı değiştirmek için önce düzenlemeyi kapatın).
        </p>
        <button onClick={addItem} className="eyebrow shrink-0 border border-line px-5 py-3 transition-colors hover:border-ink">
          + Banner Ekle
        </button>
      </div>

      {items.length === 0 && (
        <p className="border border-dashed border-line p-5 text-center text-[12px] text-ash">
          Henüz banner eklenmedi.
        </p>
      )}

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="border border-line transition-colors hover:border-ash/50">
            {editing !== item.id ? (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(index)}
                className={`flex items-center gap-4 p-4 transition-opacity ${dragIndex === index ? 'opacity-40' : ''}`}
              >
                <span
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={() => setDragIndex(null)}
                  className="text-ash select-none shrink-0 cursor-move px-1"
                  aria-hidden
                >
                  ⠿
                </span>
                <div className="w-20 h-14 shrink-0 overflow-hidden bg-shell">
                  <img src={item.src} alt="" draggable={false} className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.tagline.tr || `Banner ${index + 1}`}</p>
                  <p className="text-[10px] tracking-widest uppercase text-ash mt-0.5">{item.type} · {item.id} · {item.duration ?? 10}sn</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditing(item.id)}
                    className="eyebrow-sm bg-ink px-4 py-2.5 text-paper transition-colors hover:bg-ink/85">
                    Düzenle
                  </button>
                  <button onClick={() => deleteItem(item.id)}
                    className="eyebrow-sm border border-line px-4 py-2.5 transition-colors hover:border-ember hover:text-ember">
                    Sil
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="eyebrow-sm mb-3 block text-ash">
                      Medya (Görsel veya Video)
                    </label>
                    <MediaPickerInline
                      currentSrc={item.src}
                      targetPath={`/carousel/${item.id}.${item.type === 'video' ? 'mp4' : 'jpg'}`}
                      accept="image/*,video/*"
                      aspect="aspect-video"
                      onPathChange={(path) => updateItem(item.id, { src: path })}
                    />
                    <select value={item.type}
                      onChange={(e) => updateItem(item.id, { type: e.target.value as 'image' | 'video' })}
                      className="mt-2 w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink">
                      <option value="image">Görsel</option>
                      <option value="video">Video</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <input type="text" placeholder="Açıklama metni (alt text)"
                      value={item.alt}
                      onChange={(e) => updateItem(item.id, { alt: e.target.value })}
                      className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink" />
                    <div>
                      <label className="eyebrow-sm mb-3 block text-ash">
                        Kalma Süresi (saniye)
                      </label>
                      <input type="number" min={1} max={12} step={1}
                        value={item.duration ?? 10}
                        onChange={(e) => updateItem(item.id, { duration: Math.min(12, Math.max(1, Number(e.target.value) || 1)) })}
                        className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink" />
                    </div>
                  </div>
                </div>

                <button onClick={() => setEditing(null)}
                  className="eyebrow border border-line px-5 py-3 transition-colors hover:border-ink">
                  Kapat
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminCarouselEditor() {
  const [items, setItems] = useState<CarouselItem[]>(carouselDefault);
  const [mobileItems, setMobileItems] = useState<CarouselItem[]>(carouselMobileDefault);
  const [archiveItems, setArchiveItems] = useState<ArchiveItem[]>(archiveDefault);
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(heroDefault);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    // data === null yalnızca istek başarısız olduğunda gelir; boş dizi gerçek veridir.
    loadData<CarouselItem[]>('carousel').then((data) => {
      if (data) setItems(data);
    });
    loadData<CarouselItem[]>('carouselMobile').then((data) => {
      if (data) setMobileItems(data);
    });
    loadData<ArchiveItem[]>('archive').then((data) => {
      if (data) setArchiveItems(data);
    });
    loadData<HeroSettings>('hero').then((data) => {
      if (data) setHeroSettings(data);
    });
  }, []);

  const save = async () => {
    setStatus('saving');
    setError('');
    try {
      await saveData('carousel', items);
      await saveData('carouselMobile', mobileItems);
      await saveData('hero', heroSettings);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Kaydetme başarısız');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-3xl leading-none">Bannerler</h3>
        <div className="flex items-center gap-3">
          {status === 'saved' && <span className="eyebrow-sm text-ink">✓ Kaydedildi</span>}
          {status === 'error' && <span className="eyebrow-sm text-ember">{error}</span>}
          <button onClick={save} disabled={status === 'saving'}
            className="eyebrow bg-ink px-6 py-3 text-paper transition-colors hover:bg-ink/85 disabled:opacity-50">
            {status === 'saving' ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div className="border border-line p-5">
        <label className="eyebrow-sm mb-3 block text-ash">
          Banner Başlığı
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Başlık (TR)"
            value={heroSettings.tagline?.tr ?? ''}
            onChange={(e) => setHeroSettings({ ...heroSettings, tagline: { ...(heroSettings.tagline ?? { tr: '', en: '' }), tr: e.target.value } })}
            className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink"
          />
          <input
            type="text"
            placeholder="Başlık (EN)"
            value={heroSettings.tagline?.en ?? ''}
            onChange={(e) => setHeroSettings({ ...heroSettings, tagline: { ...(heroSettings.tagline ?? { tr: '', en: '' }), en: e.target.value } })}
            className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink"
          />
        </div>
        <p className="mt-2 text-[9px] text-ash">
          Banner&apos;ın üzerinde büyük harflerle görünen ana başlık (ör. &quot;İlkbahar Yaz 2026&quot;). Masaüstü ve mobil bannerlerde ortak kullanılır.
        </p>
      </div>

      <div className="border border-line p-5">
        <label className="eyebrow-sm mb-3 block text-ash">
          Banner Butonu Hedefi
        </label>
        <select
          value={heroSettings.ctaSlug}
          onChange={(e) => setHeroSettings({ ...heroSettings, ctaSlug: e.target.value })}
          className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink"
        >
          <option value="">Ana Sayfa (Koleksiyonlar bölümü)</option>
          {archiveItems.map((project) => (
            <option key={project.id} value={project.slug}>
              {project.title.tr} ({project.year})
            </option>
          ))}
        </select>
        <p className="mt-2 text-[9px] text-ash">
          Ziyaretçi banner&apos;daki &quot;En yeni koleksiyonumuzu keşfedin&quot; yazısına bastığında hangi koleksiyona gideceğini seçin.
        </p>
      </div>

      <div>
        <h4 className="font-display text-2xl leading-none mb-1">Masaüstü Bannerler</h4>
        <p className="mb-4 text-[11px] text-ash">Tablet ve masaüstünde gösterilir.</p>
        <BannerList items={items} onChange={setItems} idPrefix="carousel" />
      </div>

      <div className="border-t border-line pt-6">
        <h4 className="font-display text-2xl leading-none mb-1">Mobil Bannerler</h4>
        <p className="mb-4 text-[11px] text-ash">
          Yalnızca telefonlarda gösterilir — masaüstü bannerleriyle tamamen ayrı, bağımsız bir liste; bir telefon
          hiçbir zaman yukarıdaki masaüstü bannerlerini görmez. Boş bırakılırsa telefonlar geçici olarak yukarıdaki
          masaüstü bannerlerini gösterir; buraya en az bir banner eklediğiniz an telefonlar yalnızca burada
          olanları görmeye başlar.
        </p>
        <BannerList items={mobileItems} onChange={setMobileItems} idPrefix="carousel-mobile" />
      </div>

      <p className="text-[11px] text-ash">
        Değişiklikler yalnızca <strong>Kaydet</strong>&apos;e bastığınızda siteye yansır.
      </p>
    </div>
  );
}
