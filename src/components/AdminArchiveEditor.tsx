'use client';

import { useEffect, useRef, useState, type DragEvent } from 'react';
import archiveDefault from '@/data/archive';
import heroDefault from '@/data/hero';
import MediaPickerInline from './MediaPickerInline';
import { loadData, saveData, uploadFile, deleteFile } from '@/lib/api';
import { reorder } from '@/lib/reorder';

type ArchiveItem = typeof archiveDefault[0];
type GalleryImage = ArchiveItem['gallery'][0];
type HeroSettings = typeof heroDefault;

// upload.php only accepts folder names matching [a-zA-Z0-9/_-], and the slug is
// used verbatim as the gallery's folder. Turkish characters or spaces typed here
// would upload fine on localhost but fail on the live server, so fold them down
// to ASCII as the user types.
const TR_MAP: Record<string, string> = {
  ı: 'i', İ: 'i', ğ: 'g', Ğ: 'g', ü: 'u', Ü: 'u',
  ş: 's', Ş: 's', ö: 'o', Ö: 'o', ç: 'c', Ç: 'c',
};

function sanitizeSlug(input: string): string {
  return input
    .replace(/[\u0131\u0130\u011f\u011e\u00fc\u00dc\u015f\u015e\u00f6\u00d6\u00e7\u00c7]/g, (ch) => TR_MAP[ch] ?? ch)
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-');
}


function GalleryEditor({
  slug,
  gallery,
  onChange,
}: {
  slug: string;
  gallery: GalleryImage[];
  onChange: (g: GalleryImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFiles = async (files: FileList) => {
    setBusy(true);
    setErr('');
    const folder = `images/archive/${slug || 'proje'}`;
    const added: GalleryImage[] = [];
    try {
      // Numbering by gallery.length collides once the filenames have a gap: a
      // gallery of 8 holding 01-06, 08, 09 would name the next upload 09 and
      // silently overwrite it, then show the same file twice. Continue from the
      // highest number actually in use instead, and skip any that is taken.
      const used = new Set(
        gallery
          .map((g) => {
            const m = g.src.match(/\/(\d+)\.[a-z0-9]+$/i);
            return m ? parseInt(m[1], 10) : NaN;
          })
          .filter((v) => Number.isFinite(v)),
      );
      let n = used.size > 0 ? Math.max(...used) : 0;
      for (const file of Array.from(files)) {
        do {
          n += 1;
        } while (used.has(n));
        used.add(n);
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${String(n).padStart(2, '0')}.${ext}`;
        const url = await uploadFile(folder, file, filename);
        added.push({ src: url, wide: false });
      }
    } catch (e) {
      const detail = e instanceof Error ? e.message : 'Yükleme başarısız';
      setErr(
        added.length > 0
          ? `${added.length} görsel yüklendi, sonraki durdu: ${detail}`
          : detail,
      );
    } finally {
      // Yarıda kalan bir yüklemede daha önce başarılı olanlar sunucuda duruyor.
      // Listeye eklenmezlerse hem kaybolur hem de erişilemeyen dosya olarak kalır.
      if (added.length > 0) onChange([...gallery, ...added]);
      setBusy(false);
    }
  };

  // Kaldırılan görsel sunucudan da silinir; aksi halde dosya erişilemez şekilde
  // sunucuda kalır ve yeni yükleme onun üzerine yazmaz.
  const removeGallery = async (index: number) => {
    const image = gallery[index];
    if (!confirm('Bu görsel sunucudan kalıcı olarak silinecek. Devam edilsin mi?')) return;
    setErr('');
    try {
      await deleteFile(image.src);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Görsel silinemedi');
      return;
    }
    onChange(gallery.filter((_, i) => i !== index));
  };

  const toggleWide = (index: number) => {
    onChange(gallery.map((g, i) => (i === index ? { ...g, wide: !g.wide } : g)));
  };

  const handleDragStart = (e: DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDragIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    onChange(reorder(gallery, dragIndex, index));
    setDragIndex(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="eyebrow-sm text-ash">Galeri Görselleri</label>
        {busy && <span className="text-[9px] text-ash animate-pulse tracking-widest uppercase">Yükleniyor…</span>}
      </div>
      <p className="text-[9px] text-ash mb-3">Tutamaçtan (⠿) sürükleyip bırakarak sırayı değiştirebilir, anahtarla bir görseli tam genişlik yapabilirsiniz.</p>
      {err && <p className="mb-2 text-[9px] text-ember">{err}</p>}
      <div className="space-y-2">
        {gallery.map((image, i) => (
          <div
            key={i}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            className={`flex items-center gap-3 p-2 border border-line transition-opacity ${dragIndex === i ? 'opacity-40' : ''}`}
          >
            <span
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragEnd={() => setDragIndex(null)}
              className="text-ash select-none px-1 cursor-move shrink-0"
              aria-hidden
            >
              ⠿
            </span>
            <div className="w-16 h-16 shrink-0 overflow-hidden bg-shell">
              <img src={image.src} alt="" draggable={false} className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }} />
            </div>
            <span className="flex-1 min-w-0 truncate text-[10px] font-mono text-ash">{image.src}</span>
            <label className="flex items-center gap-2 text-[10px] tracking-widest uppercase shrink-0 cursor-pointer select-none">
              <input type="checkbox" checked={image.wide} onChange={() => toggleWide(i)} className="w-4 h-4" />
              Tam Genişlik
            </label>
            <button onClick={() => removeGallery(i)}
              className="eyebrow-sm shrink-0 border border-line px-3 py-2 transition-colors hover:border-ember hover:text-ember">
              Sil
            </button>
          </div>
        ))}
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer items-center justify-center border border-dashed border-line p-4 transition-colors hover:border-ink">
          <span className="eyebrow-sm text-ash">+ Görsel Ekle</span>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files) handleFiles(e.target.files); }} />
        </div>
      </div>
    </div>
  );
}

export default function AdminArchiveEditor() {
  const [items, setItems] = useState<ArchiveItem[]>(archiveDefault);
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(heroDefault);
  const [bannerBusy, setBannerBusy] = useState<string | null>(null);

  useEffect(() => {
    loadData<ArchiveItem[]>('archive').then((data) => {
      // data === null yalnızca istek başarısız olduğunda gelir; boş dizi gerçek veridir.
      if (data) setItems(data);
    });
    loadData<HeroSettings>('hero').then((data) => {
      if (data) setHeroSettings(data);
    });
  }, []);

  const setBannerTarget = async (slug: string) => {
    setBannerBusy(slug || 'none');
    const next = { ...heroSettings, ctaSlug: slug };
    try {
      await saveData('hero', next);
      setHeroSettings(next);
    } finally {
      setBannerBusy(null);
    }
  };

  const updateItem = (id: string, updates: Partial<ArchiveItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // Kapak ve galerideki her görsel de sunucudan silinir; aksi halde JSON'dan
  // kaldırılan bir proje, dosyaları hâlâ erişilebilir durumda sunucuda kalır.
  const deleteItem = (id: string) => {
    if (!confirm('Bu proje silinsin mi? Kapak ve galerideki tüm görseller sunucudan kalıcı olarak silinecek.')) return;
    const item = items.find((it) => it.id === id);
    if (item) {
      const paths = [item.coverImage, ...item.gallery.map((g) => g.src)].filter(Boolean);
      for (const path of paths) {
        deleteFile(path).catch(() => {
          // Bir dosya silinemese bile projeyi listeden kaldırmayı engelleme.
        });
      }
    }
    setItems(items.filter((it) => it.id !== id));
  };

  const handleDragStart = (e: DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDragIndex(index);
  };

  const handleDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    setItems(reorder(items, dragIndex, index));
    setDragIndex(null);
  };

  const addItem = () => {
    const newId = `proje-${Date.now()}`;
    const newItem: ArchiveItem = {
      id: newId,
      slug: newId,
      year: 'Tarih',
      category: 'collection',
      title: { tr: 'Yeni Proje', en: 'New Project' },
      coverImage: `/images/archive/${newId}/cover.jpg`,
      gallery: [],
      featured: false,
    };
    setItems([...items, newItem]);
    setEditing(newId);
  };

  const save = async () => {
    setStatus('saving');
    setError('');
    try {
      await saveData('archive', items);
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
        <h3 className="font-display text-3xl leading-none">Koleksiyonlar</h3>
        <div className="flex items-center gap-3">
          {status === 'saved' && <span className="eyebrow-sm text-ink">✓ Kaydedildi</span>}
          {status === 'error' && <span className="eyebrow-sm text-ember">{error}</span>}
          <button onClick={addItem} className="eyebrow border border-line px-5 py-3 transition-colors hover:border-ink">
            + Proje Ekle
          </button>
          <button onClick={save} disabled={status === 'saving'}
            className="eyebrow bg-ink px-6 py-3 text-paper transition-colors hover:bg-ink/85 disabled:opacity-50">
            {status === 'saving' ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-ash">Projeleri sürükleyip bırakarak sırasını değiştirebilirsiniz (sıralamayı değiştirmek için önce düzenlemeyi kapatın). &quot;Banner Hedefi Yap&quot;a basarsanız, ana sayfadaki banner&apos;ın butonu ziyaretçiyi o koleksiyona götürür — bu değişiklik anında kaydedilir.</p>

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
                <div className="w-14 h-20 shrink-0 overflow-hidden bg-shell">
                  <img src={item.coverImage} alt="" draggable={false} className="w-full h-full object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title.tr}</p>
                  <p className="text-[10px] tracking-widest uppercase text-ash mt-0.5">
                    {item.year} · {item.category}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {heroSettings.ctaSlug === item.slug ? (
                    <button onClick={() => setBannerTarget('')} disabled={bannerBusy !== null}
                      className="eyebrow-sm bg-ink px-4 py-2.5 text-paper transition-colors hover:bg-ink/85 disabled:opacity-50">
                      {bannerBusy !== null ? '…' : '✓ Banner Hedefi'}
                    </button>
                  ) : (
                    <button onClick={() => setBannerTarget(item.slug)} disabled={bannerBusy !== null}
                      className="eyebrow-sm border border-line px-4 py-2.5 transition-colors hover:border-ink disabled:opacity-50">
                      {bannerBusy === item.slug ? '…' : 'Banner Hedefi Yap'}
                    </button>
                  )}
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
                    <label className="eyebrow-sm mb-3 block text-ash">Kapak Görseli</label>
                    <MediaPickerInline
                      currentSrc={item.coverImage}
                      targetPath={`/images/archive/${item.slug}/cover.jpg`}
                      accept="image/*"
                      aspect="aspect-[3/4]"
                      onPathChange={(path) => updateItem(item.id, { coverImage: path })}
                    />
                  </div>

                  <div className="space-y-3">
                    <input type="text" placeholder="Baslik (TR)"
                      value={item.title.tr}
                      onChange={(e) => updateItem(item.id, { title: { ...item.title, tr: e.target.value } })}
                      className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink" />

                    <input type="text" placeholder="Baslik (EN)"
                      value={item.title.en}
                      onChange={(e) => updateItem(item.id, { title: { ...item.title, en: e.target.value } })}
                      className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink" />

                    <input type="text" placeholder="URL kodu (ornek: ilkbahar-yaz-2024)"
                      value={item.slug}
                      onChange={(e) => updateItem(item.id, { slug: sanitizeSlug(e.target.value) })}
                      className="w-full border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink font-mono" />

                    <div className="grid grid-cols-2 gap-3">
                      <select value={item.category}
                        onChange={(e) => updateItem(item.id, { category: e.target.value })}
                        className="border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink">
                        <option value="collection">Koleksiyon</option>
                        <option value="textile">Tekstil</option>
                        <option value="accessory">Aksesuar</option>
                        <option value="workshop">Atolye</option>
                      </select>
                      <input type="text" placeholder="Yil"
                        value={item.year}
                        onChange={(e) => updateItem(item.id, { year: e.target.value })}
                        className="border border-line bg-transparent px-3 py-2.5 text-sm outline-none transition-colors focus:border-ink" />
                    </div>

                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={item.featured}
                        onChange={(e) => updateItem(item.id, { featured: e.target.checked })}
                        className="w-4 h-4" />
                      <span className="text-sm">One Cikar</span>
                    </label>
                  </div>
                </div>

                <GalleryEditor
                  slug={item.slug}
                  gallery={item.gallery}
                  onChange={(g) => updateItem(item.id, { gallery: g })}
                />

                <button onClick={() => setEditing(null)}
                  className="eyebrow border border-line px-5 py-3 transition-colors hover:border-ink">
                  Kapat
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[11px] text-ash">
        Değişiklikler yalnızca <strong>Kaydet</strong>&apos;e bastığınızda siteye yansır. Yeni proje eklerseniz, o projenin ayrı sayfası (<code>/work/url-kodu</code>) ancak siteyi yeniden derleyip yayınladığınızda oluşur.
      </p>
    </div>
  );
}
