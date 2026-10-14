import Link from 'next/link';
import { PAGE_SIZE } from '@/lib/pagination';
import { interfaceCopy as c } from '@/lib/interface-copy';

export function Pagination({ page, count, path, params = {} }: {
  page: number; count: number; path: string; params?: Record<string, string>;
}) {
  const href = (value: number) => `${path}?${new URLSearchParams({ ...params, page: String(value) })}`;
  return <nav className="actions section-gap" aria-label={c.page}>
    <span className="muted">{c.results}: {count} · {c.page} {page}</span>
    {page > 1 && <Link className="button button-secondary" href={href(page - 1)}>{c.previous}</Link>}
    {page * PAGE_SIZE < count && <Link className="button button-secondary" href={href(page + 1)}>{c.next}</Link>}
  </nav>;
}
