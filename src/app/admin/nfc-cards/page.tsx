import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { adminCopy as c } from '@/lib/admin-copy';
import { textParam, type SearchParams } from '@/lib/analytics';
import { listParams, PAGE_SIZE, Pagination, organizationOptions } from '../_components';
import { z } from 'zod';

export default async function AdminCards({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { page } = listParams(params);
  const organization = textParam(params.organization);
  if (organization && !z.uuid().safeParse(organization).success) throw new Error(c.invalid);
  let query = supabase.from('nfc_cards').select('id,name,code,is_active,organization_id', { count: 'exact' }).order('created_at', { ascending: false }).order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (organization) query = query.eq('organization_id', organization);
  const [{ data, error, count }, organizations] = await Promise.all([query, organizationOptions(supabase)]);
  if (error) throw new Error(c.readFailed);
  const names = new Map(organizations.map(org => [org.id, org.name]));
  return <><div className="page-header"><h1>{c.cards}</h1><form method="get" className="actions"><label className="field"><span className="sr-only">{c.organization}</span><select name="organization" defaultValue={organization}><option value="">{c.allOrganizations}</option>{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label><button className="button button-secondary">{c.apply}</button></form></div><section className="panel">{!data?.length ? <p className="empty">{c.noRecords}</p> : <div className="table-wrap"><table><thead><tr><th>{c.name}</th><th>{c.organization}</th><th>{c.code}</th><th>{c.status}</th><th>{c.manage}</th></tr></thead><tbody>{data.map(card => <tr key={card.id}><td>{card.name}</td><td>{names.get(card.organization_id)}</td><td><code>{card.code}</code></td><td>{card.is_active ? c.active : c.inactive}</td><td><Link className="button button-secondary button-sm" href={`/admin/nfc-cards/${card.id}`}>{c.manage}</Link></td></tr>)}</tbody></table></div>}<Pagination page={page} count={count ?? 0} path="/admin/nfc-cards" params={{ organization }} /></section></>;
}
