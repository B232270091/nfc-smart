import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/t/[code]/route';

const mocks = vi.hoisted(() => ({
  after: vi.fn(),
  resolve: vi.fn(),
  record: vi.fn(),
  abortSignal: vi.fn(),
  service: vi.fn(),
}));

vi.mock('next/server', async (importOriginal) => ({
  ...await importOriginal<typeof import('next/server')>(),
  after: mocks.after,
}));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ rpc: mocks.resolve }),
}));
vi.mock('@/lib/supabase/service', () => ({
  serviceClient: mocks.service,
}));
vi.mock('@/lib/env', () => ({
  appUrl: () => 'https://nfc.example',
  hasSupabase: () => true,
}));

const code = '0123456789abcdef01234567';
function request(method: 'GET' | 'HEAD') {
  return new NextRequest(`https://nfc.example/t/${code}?src=qr`, {
    method,
    headers: {
      'user-agent': 'Mozilla/5.0 Chrome/140.0',
      'x-vercel-forwarded-for': '192.0.2.1',
    },
  });
}

describe('NFC redirect scan recording', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv('ANALYTICS_HMAC_SECRET', 'test-secret-for-nfc-route-32-characters');
    mocks.resolve.mockResolvedValue({ data: 'published-menu', error: null });
    mocks.record.mockReturnValue({ abortSignal: mocks.abortSignal });
    mocks.service.mockReturnValue({ rpc: mocks.record });
    mocks.abortSignal.mockResolvedValue({ data: true, error: null });
  });

  afterEach(() => vi.unstubAllEnvs());

  it('redirects automatic HEAD requests without recording or consuming a scan', async () => {
    // Next.js routes HEAD through GET when the route has no explicit HEAD export.
    const response = await GET(request('HEAD'), { params: Promise.resolve({ code }) });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://nfc.example/p/published-menu');
    expect(mocks.resolve).toHaveBeenCalledWith('resolve_nfc_card', { p_code: code });
    expect(mocks.after).not.toHaveBeenCalled();
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it('records an eligible GET after returning the destination redirect', async () => {
    const response = await GET(request('GET'), { params: Promise.resolve({ code }) });

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://nfc.example/p/published-menu');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.after).toHaveBeenCalledOnce();
    expect(mocks.record).not.toHaveBeenCalled();

    await mocks.after.mock.calls[0][0]();

    expect(mocks.record).toHaveBeenCalledWith('record_scan', {
      p_code: code,
      p_source: 'qr',
      p_fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/),
    });
    expect(mocks.abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it.each(['purpose', 'sec-purpose', 'next-router-prefetch', 'x-moz'])('does not count %s previews', async header => {
    const req = request('GET'); req.headers.set(header, 'prefetch');
    expect((await GET(req, { params: Promise.resolve({ code }) })).status).toBe(307);
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it('does not count bots or spoofable forwarding headers on other hosts', async () => {
    const bot = request('GET'); bot.headers.set('user-agent', 'Googlebot');
    await GET(bot, { params: Promise.resolve({ code }) });
    vi.stubEnv('VERCEL', '');
    await GET(request('GET'), { params: Promise.resolve({ code }) });
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it.each([null, 'https://evil.example', '//evil.example', '../admin', 'bad--slug'])('refuses unavailable or unsafe destination %s', async slug => {
    mocks.resolve.mockResolvedValue({ data: slug, error: null });
    const response = await GET(request('GET'), { params: Promise.resolve({ code }) });
    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it('returns an uncached retryable failure for database outages', async () => {
    mocks.resolve.mockRejectedValue(new Error('network unavailable'));
    const response = await GET(request('GET'), { params: Promise.resolve({ code }) });
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it('preserves the redirect when analytics initialization or recording throws', async () => {
    mocks.service.mockImplementation(() => { throw new Error('misconfiguration'); });
    expect((await GET(request('GET'), { params: Promise.resolve({ code }) })).status).toBe(307);
    await expect(mocks.after.mock.calls[0][0]()).resolves.toBeUndefined();
    mocks.service.mockReturnValue({ rpc: mocks.record });
    mocks.abortSignal.mockRejectedValue(new Error('timeout'));
    await expect(mocks.after.mock.calls[0][0]()).resolves.toBeUndefined();
  });

  it('does not claim unmarked or spoofed sources are physical NFC taps', async () => {
    const req = new NextRequest(`https://nfc.example/t/${code}?src=nfc`, { headers: request('GET').headers });
    await GET(req, { params: Promise.resolve({ code }) });
    await mocks.after.mock.calls[0][0]();
    expect(mocks.record.mock.calls[0][1].p_source).toBe('unknown');
  });
});
