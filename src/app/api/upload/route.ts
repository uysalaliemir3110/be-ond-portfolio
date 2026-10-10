import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

const ALLOWED_EXT = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov', 'webm'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const folder = (form.get('folder') as string | null) ?? '';
    const filename = (form.get('filename') as string | null) ?? file?.name ?? 'dosya';

    if (!file) return NextResponse.json({ error: 'Dosya eksik' }, { status: 400 });

    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json({ error: 'Desteklenmeyen dosya türü' }, { status: 400 });
    }

    const publicDir = path.join(process.cwd(), 'public');
    const destDir = path.join(publicDir, folder);
    await mkdir(destDir, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    let finalFilename = filename;
    let finalBuffer = buffer;

    if (IMAGE_EXTS.includes(ext)) {
      finalFilename = filename.replace(/\.[^.]+$/, '.webp');
      // Cover images only ever render as small grid thumbnails, so they don't
      // need full detail-page resolution — shrinking them cuts grid load time
      // without any visible quality loss at the size they're actually shown.
      const isCover = /^cover\./i.test(filename);
      const maxWidth = isCover ? 960 : 1920;
      const quality = isCover ? 75 : 80;
      // @ts-expect-error Buffer type mismatch with sharp
      finalBuffer = await sharp(buffer)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
    }

    await writeFile(path.join(destDir, finalFilename), finalBuffer);

    const url = `/${folder}/${finalFilename}`.replace(/\/+/g, '/');
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
