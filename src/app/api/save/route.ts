import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { syncAll } from '../../../../scripts/sync-data.mjs';

export async function POST(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get('type');
    const validTypes = ['carousel', 'carouselMobile', 'archive', 'hero', 'about'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Geçersiz tip' }, { status: 400 });
    }

    const data = await req.json();
    const dataDir = path.join(process.cwd(), 'public', 'data');
    await mkdir(dataDir, { recursive: true });
    await writeFile(path.join(dataDir, `${type}.json`), JSON.stringify(data, null, 2));

    // Production saves go through public/api/save.php on cPanel and a manual
    // `sync-data && build` before upload (see README). This route only runs
    // on localhost, where there's no rebuild step, so fold the change into
    // the bundled defaults immediately — otherwise a new collection 404s on
    // /work/<slug> until someone remembers to sync by hand.
    syncAll();

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
