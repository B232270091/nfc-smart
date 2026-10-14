import Link from 'next/link';
import type { SupabaseClient } from '@supabase/supabase-js';
import { textParam, type SearchParams } from '@/lib/analytics';
import { adminCopy as c } from '@/lib/admin-copy';

export const PAGE_SIZE = 50;
export function listParams(params: SearchParams) {
  const page = Number(textParam(params.page) || '1');
  return { page: Number.isSafeInteger(page) && page > 0 && page <= 100000 ? page : 1, q: textParam(params.q).trim().slice(0, 120) };
}
export function Pagination({ page, count, path, params = {} }: { page: number; count: number; path: string; params?: Record<string, string> }) {
  const href = (value: number) => `${path}?${new URLSearchParams({ ...params, page: String(value) })}`;
  return <nav className="actions section-gap" aria-label={c.page}><span className="muted">{c.results}: {count} · {c.page} {page}</span>{page > 1 && <Link className="button button-secondary" href={href(page - 1)}>{c.previous}</Link>}{page * PAGE_SIZE < count && <Link className="button button-secondary" href={href(page + 1)}>{c.next}</Link>}</nav>;
}
export function Search({ q }: { q: string }) {
  return <form className="actions" method="get"><label className="field"><span className="sr-only">{c.search}</span><input className="input" name="q" defaultValue={q} placeholder={c.searchPlaceholder} maxLength={120} /></label><button className="button button-secondary">{c.search}</button></form>;
}
// Fetch every option in bounded batches; no silent PostgREST 1,000-row truncation.
export async function organizationOptions(supabase: SupabaseClient) {
  const all: { id: string; name: string }[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase.from('organizations').select('id,name').order('id').range(offset, offset + 499);
    if (error) throw new Error(c.readFailed);
    all.push(...(data ?? []));
    if ((data?.length ?? 0) < 500) return all;
  }
}
