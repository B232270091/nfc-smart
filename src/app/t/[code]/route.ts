import { NextResponse, type NextRequest, after } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import { appUrl, hasSupabase } from '@/lib/env';
import { cardCodePattern, eligibleScanRequest, scanFingerprint } from '@/lib/nfc';
import { nfcCopy as c } from '@/lib/nfc-copy';

const headers = {
  'Cache-Control': 'no-store, max-age=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex',
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!cardCodePattern.test(code) || !hasSupabase()) return new NextResponse(c.notFound, { status: 404, headers });
  let slug: unknown;
  try {
    const supabase = await createClient();
    const result = await supabase.rpc('resolve_nfc_card', { p_code: code });
    if (result.error) return new NextResponse(c.temporarilyUnavailable, { status: 503, headers });
    slug = result.data;
  } catch {
    return new NextResponse(c.temporarilyUnavailable, { status: 503, headers });
  }
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return new NextResponse(c.notFound, { status: 404, headers });
  }
  const secret = process.env.ANALYTICS_HMAC_SECRET;
  // Vercel overwrites this header. Other hosts need their own trusted adapter.
  const ip = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : null;
  if (eligibleScanRequest(request.method, request.headers) && secret && secret.length >= 32 && ip) {
    const source = request.nextUrl.searchParams.get('src') === 'qr' ? 'qr' : 'unknown';
    after(async () => {
      try {
        // Configuration/client-construction failures must not break a valid redirect either.
        const service = serviceClient();
        if (service) await service.rpc('record_scan', {
          p_code: code, p_source: source, p_fingerprint: scanFingerprint(ip, code, secret),
        }).abortSignal(AbortSignal.timeout(2000));
      } catch { /* Analytics must never interrupt a destination. */ }
    });
  }
  return NextResponse.redirect(new URL(`/p/${slug}`, appUrl()), { status: 307, headers });
}
