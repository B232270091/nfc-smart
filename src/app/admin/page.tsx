import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { adminCopy as c } from '@/lib/admin-copy';
import { formatCount } from '@/lib/analytics';

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const results = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('organizations').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('nfc_cards').select('id', { count: 'exact', head: true }),
  ]);
  if (results.some(result => result.error)) throw new Error(c.readFailed);
  return <><div className="page-header"><div><h1>{c.title}</h1><p className="muted">{c.description}</p></div></div><div className="grid-3">{[c.registeredOrganizations, c.activeOrganizations, c.allCards].map((label, index) => <section className="panel" key={label}><div className="metric-label">{label}</div><div className="metric">{formatCount(results[index].count ?? 0)}</div></section>)}</div><div className="panel section-gap stack"><h2>{c.manage}</h2><div className="actions"><Link href="/admin/organizations" className="button">{c.organizations}</Link><Link href="/admin/nfc-cards" className="button button-secondary">{c.cards}</Link><Link href="/admin/analytics" className="button button-secondary">{c.analytics}</Link></div><p className="muted">{c.restricted}</p></div></>;
}
