import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatMnt(value: number | string | bigint) { return `${new Intl.NumberFormat('mn-MN', { maximumFractionDigits: 0 }).format(BigInt(value))} ₮`; }
export function safeRedirect(value: string | null | undefined, fallback = '/dashboard') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value)) return fallback;
  try { const url = new URL(value, 'https://nfc.invalid'); return url.origin === 'https://nfc.invalid' ? url.pathname + url.search : fallback; } catch { return fallback; }
}
export function safeWebUrl(value: string | null | undefined) {
  if (!value) return null;
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : null; } catch { return null; }
}
