'use client';

import { useState, useSyncExternalStore } from 'react';
import AdminArchiveEditor from '@/components/AdminArchiveEditor';
import AdminCarouselEditor from '@/components/AdminCarouselEditor';
import AdminAboutEditor from '@/components/AdminAboutEditor';
import Wordmark from '@/components/Wordmark';
import {
  login,
  setAdminPassword,
  clearAdminPassword,
  subscribeAdminPassword,
  hasAdminPassword,
} from '@/lib/api';

function LoginGate() {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const ok = await login(pw);
    setBusy(false);
    if (ok) {
      // Şifreyi kaydetmek abonelere haber verir; panel kendiliğinden açılır.
      setAdminPassword(pw);
    } else {
      setError('Şifre hatalı veya sunucuya ulaşılamadı.');
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-8">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5">
        <div className="text-center mb-10">
          <Wordmark className="font-sans text-lg font-medium tracking-[0.32em] block mb-3" />
          <p className="eyebrow-sm text-ash">Yönetim Paneli</p>
        </div>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Şifre"
          autoFocus
          className="w-full border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-ink"
        />
        {error && <p className="text-[12px] text-ember">{error}</p>}
        <button type="submit" disabled={busy}
          className="eyebrow w-full bg-ink px-4 py-4 text-paper transition-colors hover:bg-ink/85 disabled:opacity-50">
          {busy ? 'Kontrol ediliyor…' : 'Giriş Yap'}
        </button>
      </form>
    </div>
  );
}

export default function AdminPage() {
  // Giriş durumu sessionStorage'da tutulur. Statik export'ta sunucu tarafında
  // böyle bir depo olmadığı için ilk anlık görüntü her zaman "girilmemiş".
  const authed = useSyncExternalStore(subscribeAdminPassword, hasAdminPassword, () => false);
  const [tab, setTab] = useState<'archive' | 'carousel' | 'about'>('archive');

  if (!authed) return <LoginGate />;

  return (
    <div className="min-h-screen bg-paper">
      <div className="border-b border-line">
        <div className="edge mx-auto flex max-w-5xl items-center justify-between py-5">
          <Wordmark className="font-sans text-sm font-medium tracking-[0.32em]" />
          <button
            onClick={() => clearAdminPassword()}
            className="eyebrow-sm wipe shrink-0 text-ash transition-colors hover:text-ink"
          >
            Çıkış
          </button>
        </div>
      </div>

      <div className="edge mx-auto max-w-5xl py-14">
        <div className="mb-12">
          <p className="eyebrow-sm mb-4 text-ash">Yönetim Paneli</p>
          <h1 className="font-display text-5xl leading-none mb-4">Düzenle</h1>
          <p className="max-w-xl text-sm leading-relaxed text-ash">
            Koleksiyonları, banner görsellerini ve hakkında metnini düzenleyin. Görselleri doğrudan yükleyin, <strong className="font-medium text-ink">Kaydet</strong>&apos;e basınca site anında güncellenir.
          </p>
        </div>

        <div className="flex gap-8 mb-12 border-b border-line">
          {([
            { key: 'archive', label: 'Projeler' },
            { key: 'carousel', label: 'Banner' },
            { key: 'about', label: 'Hakkında' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`eyebrow -mb-px pb-4 transition-colors ${
                tab === t.key
                  ? 'border-b border-ink text-ink'
                  : 'border-b border-transparent text-ash hover:text-ink'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div>
          {tab === 'archive' && <AdminArchiveEditor />}
          {tab === 'carousel' && <AdminCarouselEditor />}
          {tab === 'about' && <AdminAboutEditor />}
        </div>

        <div className="mt-20 pt-8 border-t border-line">
          <h3 className="eyebrow-sm mb-5 text-ash">Nasıl çalışır</h3>
          <ul className="max-w-2xl text-sm leading-relaxed text-ash space-y-2 list-disc list-inside marker:text-line">
            <li>Projeyi veya banner&apos;ı düzenleyin; görseli kutuya tıklayıp doğrudan yükleyin</li>
            <li><strong>Kaydet</strong>&apos;e basın — değişiklikler siteye anında yansır</li>
            <li>Mevcut projelerin metin ve görselleri canlı güncellenir</li>
            <li>Tamamen <strong>yeni</strong> bir proje eklerseniz, ayrı detay sayfası ancak site yeniden yayınlanınca oluşur</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
