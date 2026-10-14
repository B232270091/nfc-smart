import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { adminCopy as c } from '@/lib/admin-copy';
import type { SearchParams } from '@/lib/analytics';
import { listParams, PAGE_SIZE, Pagination, Search } from '../_components';

export default async function AdminOrganizations({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin();
  const { page, q } = listParams(await searchParams);
  let query = supabase.from('organizations').select('id,name,slug,is_active', { count: 'exact' }).order('created_at', { ascending: false }).order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.ilike('name', `%${q.replace(/[%_]/g, '')}%`);
  const { data, error, count } = await query;
  if (error) throw new Error(c.readFailed);
  return <><div className="page-header"><h1>{c.organizations}</h1><Search q={q} /></div><section className="panel">{!data?.length ? <p className="empty">{c.noRecords}</p> : <div className="table-wrap"><table><thead><tr><th>{c.name}</th><th>{c.slug}</th><th>{c.status}</th><th>{c.manage}</th></tr></thead><tbody>{data.map(org => <tr key={org.id}><td>{org.name}</td><td>{org.slug}</td><td><span className="badge">{org.is_active ? c.active : c.inactive}</span></td><td><Link className="button button-secondary button-sm" href={`/admin/organizations/${org.id}`}>{c.manage}</Link></td></tr>)}</tbody></table></div>}<Pagination page={page} count={count ?? 0} path="/admin/organizations" params={{ q }} /></section></>;
}
