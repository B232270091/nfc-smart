'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { nfcCopy as c } from '@/lib/nfc-copy';

export function CardTools({ url, name }: { url: string; name: string }) {
  const [result, setResult] = useState<{ url: string; qr?: string; error?: boolean }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    const u = new URL(url); u.searchParams.set('src', 'qr');
    QRCode.toDataURL(u.href, { width: 600, margin: 3, errorCorrectionLevel: 'M' })
      .then(qr => { if (live) setResult({ url, qr }); })
      .catch(() => { if (live) setResult({ url, error: true }); });
    return () => { live = false; };
  }, [url, attempt]);
  const current = result?.url === url ? result : undefined;
  return <div className="grid-2">
    <div className="stack">
      <div className="code-box" data-testid="nfc-url">{url}</div>
      <div className="actions">
        <button type="button" className="button button-secondary button-sm" onClick={async () => {
          try { await navigator.clipboard.writeText(url); toast.success(c.copied); }
          catch { toast.error(c.copyError); }
        }}><Copy size={15} />{c.copy}</button>
        <a className="button button-secondary button-sm" href={url} target="_blank" rel="noreferrer"><ExternalLink size={15} />{c.preview}</a>
      </div>
    </div>
    <div className="stack" style={{ justifyItems: 'start' }}>
      {current?.qr ? <><img className="qr-image" src={current.qr} alt={`${name} QR`} />
        <a className="button button-secondary button-sm" href={current.qr} download={`nfc-${name.replace(/[^a-z0-9]/gi, '-')}.png`}><Download size={15} />{c.download}</a></> :
        current?.error ? <><p role="alert">{c.qrError}</p><button type="button" className="button button-secondary" onClick={() => { setResult(undefined); setAttempt(value => value + 1); }}>{c.retry}</button></> :
        <p role="status" className="muted">{c.qrLoading}</p>}
    </div>
  </div>;
}