import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

// Mirrors public/api/delete.php so the admin panel behaves the same on
// localhost, where PHP is not available. The same restrictions apply: only the
// panel's own media folders, only media extensions, and the resolved path must
// stay inside public/.
const ALLOWED_PREFIXES = ['images/archive/', 'carousel/', 'about/'];
const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'mp4', 'webm', 'mov'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rel = String(body?.path ?? '').replace(/^\/+/, '');

    if (!rel || rel.includes('..') || rel.includes('\0') || !/^[a-zA-Z0-9/._-]+$/.test(rel)) {
      return NextResponse.json({ error: 'Geçersiz yol' }, { status: 400 });
    }
    if (!ALLOWED_PREFIXES.some((p) => rel.startsWith(p))) {
      return NextResponse.json({ error: 'Bu klasörden silme yetkisi yok' }, { status: 403 });
    }
    const ext = rel.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: `Bu dosya türü silinemez: .${ext}` }, { status: 403 });
    }

    const root = path.join(process.cwd(), 'public');
    const full = path.resolve(root, rel);
    if (!full.startsWith(root + path.sep)) {
      return NextResponse.json({ error: 'Yol site kökünün dışında' }, { status: 403 });
    }

    try {
      await unlink(full);
    } catch (e) {
      // Zaten silinmişse hata gösterme.
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
        return NextResponse.json({ ok: true, missing: true });
      }
      throw e;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
