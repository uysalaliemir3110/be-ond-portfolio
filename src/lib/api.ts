'use client';

/**
 * Yönetim panelinin PHP arka ucuyla konuşan yardımcılar.
 * Şifre, oturum boyunca sessionStorage'da tutulur ve her istekte gönderilir.
 */

const API_BASE = '/api';

// True only for `next dev` (inlined at build time — this branch is compiled
// out of the exported production bundle entirely). Used to route around the
// PHP backend, which only exists once the site is actually deployed.
//
// This used to check `location.hostname === 'localhost'`, which broke as
// soon as the dev server was opened from another device on the LAN (e.g. a
// phone, at the 192.168.x.x address next.config.ts already allows) — that
// hostname doesn't match, so it fell through to a real fetch("login.php")
// that has nothing to answer it. Checking the build mode instead works from
// any device that can reach the dev server, not just this machine.
const isDev = process.env.NODE_ENV !== 'production';

function uploadUrl() {
  return isDev ? '/api/upload' : `${API_BASE}/upload.php`;
}

function deleteUrl() {
  return isDev ? '/api/delete' : `${API_BASE}/delete.php`;
}

function saveUrl(type: string) {
  return isDev ? `/api/save?type=${type}` : `${API_BASE}/save.php?type=${type}`;
}

// Demo-only password for this portfolio build (local dev + the public Vercel
// copy). Deliberately NOT the real production password — this fork never
// talks to the live cPanel/PHP backend, so the real ADMIN_PASSWORD in
// public/api/config.php never needs to live in source control here.
const DEV_ADMIN_PASSWORD = 'beond-portfolio-2026';

const PW_KEY = 'beond_admin_pw';

export function getAdminPassword(): string {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem(PW_KEY) || '';
}

/**
 * sessionStorage aynı sekmedeki değişiklikler için olay yayınlamaz, bu yüzden
 * giriş/çıkış durumunu React'e bildirebilmek adına kendi abonelik listemizi
 * tutuyoruz. Yönetim paneli bunu useSyncExternalStore ile okur.
 */
const pwListeners = new Set<() => void>();

export function subscribeAdminPassword(onChange: () => void): () => void {
  pwListeners.add(onChange);
  return () => {
    pwListeners.delete(onChange);
  };
}

/** Oturumda kayıtlı şifre var mı? (useSyncExternalStore anlık görüntüsü) */
export function hasAdminPassword(): boolean {
  return getAdminPassword() !== '';
}

export function setAdminPassword(pw: string) {
  sessionStorage.setItem(PW_KEY, pw);
  pwListeners.forEach((l) => l());
}

export function clearAdminPassword() {
  sessionStorage.removeItem(PW_KEY);
  pwListeners.forEach((l) => l());
}

/** Şifreyi doğrular. Doğruysa true döner. */
export async function login(password: string): Promise<boolean> {
  // This portfolio build has no PHP backend to check against (the real one
  // lives only on the production cPanel host), so it always checks the
  // demo password client-side — in `next dev` and in the deployed demo.
  return password === DEV_ADMIN_PASSWORD;
}

/** Sunucudaki güncel veriyi getirir; yoksa null döner (yerel varsayılan kullanılır). */
export async function loadData<T>(type: 'carousel' | 'carouselMobile' | 'archive' | 'hero' | 'about'): Promise<T | null> {
  try {
    const res = await fetch(`/data/${type}.json`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Veriyi sunucuya kaydeder. */
export async function saveData(type: 'carousel' | 'carouselMobile' | 'archive' | 'hero' | 'about', data: unknown): Promise<void> {
  const res = await fetch(saveUrl(type), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': getAdminPassword(),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.error || 'Kaydetme başarısız oldu');
  }
}

/** Dosyayı sunucuya yükler, erişilebilir URL'yi döner. */
export async function uploadFile(folder: string, file: File, filename?: string): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  if (filename) fd.append('filename', filename);

  const res = await fetch(uploadUrl(), {
    method: 'POST',
    headers: { 'X-Admin-Password': getAdminPassword() },
    body: fd,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.url) {
    throw new Error(json.error || 'Yükleme başarısız oldu');
  }
  return json.url as string;
}

/** "/carousel/01.jpg" -> { folder: "carousel", filename: "01.jpg" } */
export function splitPath(targetPath: string): { folder: string; filename: string } {
  const clean = targetPath.replace(/^\//, '');
  const parts = clean.split('/');
  const filename = parts.pop() || 'dosya.jpg';
  return { folder: parts.join('/'), filename };
}

/** Panelden kaldırılan medyayı sunucudan siler. */
export async function deleteFile(path: string): Promise<void> {
  const res = await fetch(deleteUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Password': getAdminPassword(),
    },
    body: JSON.stringify({ path }),
  });
  if (!res.ok) {
    const msg = await res.json().catch(() => ({}));
    throw new Error(msg.error || 'Dosya silinemedi');
  }
}
