import { requireAdmin } from '@/lib/auth';
import { adminCopy as c } from '@/lib/admin-copy';
import { textParam, type SearchParams } from '@/lib/analytics';
import { Search } from '../_components';
import { Pagination } from '@/components/pagination';
import { PAGE_SIZE, pageNumber } from '@/lib/pagination';

export default async function AdminUsers({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const q = textParam(params.q).trim().slice(0, 120);
  const page = pageNumber(params.page);
  const { data, error } = await supabase.rpc('search_platform_users', { p_query: q, p_offset: (page - 1) * PAGE_SIZE, p_limit: PAGE_SIZE });
  if (error) throw new Error(c.readFailed);
  const result = data as { count: number; users: { id: string; email: string; created_at: string }[] };
  return <><div className="page-header"><h1>{c.users}</h1><Search q={q} /></div><section className="panel">{!result.users.length ? <p className="empty">{c.noRecords}</p> : <div className="table-wrap"><table><thead><tr><th>{c.email}</th><th>ID</th><th>{c.created}</th></tr></thead><tbody>{result.users.map(user => <tr key={user.id}><td>{user.email}</td><td><small>{user.id}</small></td><td>{new Intl.DateTimeFormat('mn-MN', { timeZone: 'Asia/Ulaanbaatar', dateStyle: 'medium' }).format(new Date(user.created_at))}</td></tr>)}</tbody></table></div>}</section><Pagination page={page} count={result.count} path="/admin/users" params={{ q }} /></>;
}
