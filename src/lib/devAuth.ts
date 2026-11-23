import { NextRequest, NextResponse } from 'next/server';
import { DEMO_ADMIN_PASSWORD } from './demoPassword';

/**
 * The /api/* routes only exist under `next dev`, but the dev server is
 * reachable from the LAN (see allowedDevOrigins), so they check the same
 * header the PHP endpoints do. Returns a 401 response, or null if allowed.
 */
export function requireDevAuth(req: NextRequest): NextResponse | null {
  if (req.headers.get('x-admin-password') === DEMO_ADMIN_PASSWORD) return null;
  return NextResponse.json({ error: 'Yetkisiz. Şifre hatalı.' }, { status: 401 });
}
