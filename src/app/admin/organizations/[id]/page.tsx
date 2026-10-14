import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { ActionForm, Field } from '@/components/forms';
import { updateAdminOrganization, upsertAdminMember, removeAdminMember } from '@/lib/actions/admin';
import { adminCopy as c } from '@/lib/admin-copy';
import type { SearchParams } from '@/lib/analytics';
import { listParams, PAGE_SIZE, Pagination } from '../../_components';

export default async function AdminOrganization({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { page } = listParams(await searchParams);
  const [orgResult, membersResult, pagesResult] = await Promise.all([
    supabase.from('organizations').select('id,name,slug,is_active').eq('id', id).maybeSingle(),
    supabase.from('organization_members').select('user_id,role,permissions', { count: 'exact' }).eq('organization_id', id).order('created_at').limit(1000),
    supabase.from('pages').select('id,title,type,is_published', { count: 'exact' }).eq('organization_id', id).order('created_at').order('id').range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
  ]);
  if (orgResult.error || membersResult.error || pagesResult.error) throw new Error(c.readFailed);
  const org = orgResult.data;
  if (!org) notFound();
  return <div className="stack"><div className="page-header"><div><h1>{org.name}</h1><p className="muted">{org.id}</p></div></div><section className="panel"><ActionForm action={updateAdminOrganization} confirmMessage={c.toggleConfirm}><input type="hidden" name="id" value={id} /><Field label={c.name} name="name" defaultValue={org.name} required minLength={2} maxLength={120} /><Field label={c.slug} name="slug" defaultValue={org.slug} required minLength={3} maxLength={80} /><label className="actions"><input type="checkbox" name="is_active" defaultChecked={org.is_active} />{c.active}</label></ActionForm></section>
    <div className="grid-2"><section className="panel stack"><h2>{c.addMember}</h2><p className="muted">{c.registeredFirst}</p><ActionForm action={upsertAdminMember}><input type="hidden" name="organization_id" value={id} /><Field label={c.email} name="email" type="email" required /><label className="field"><span>{c.role}</span><select name="role"><option value="staff">{c.staff}</option><option value="owner">{c.owner}</option></select></label><fieldset className="stack"><legend>{c.permissions}</legend>{(['menu', 'pages', 'cards', 'analytics'] as const).map(permission => <label className="actions" key={permission}><input type="checkbox" name="permissions" value={permission} />{c[permission]}</label>)}</fieldset></ActionForm></section><section className="panel"><h2>{c.members}</h2>{(membersResult.count ?? 0) > 1000 && <p className="muted">{c.memberLimit}</p>}<div className="table-wrap"><table><thead><tr><th>ID / {c.role}</th><th>{c.permissions}</th><th>{c.remove}</th></tr></thead><tbody>{membersResult.data?.map(member => <tr key={member.user_id}><td><small style={{ overflowWrap: 'anywhere' }}>{member.user_id}</small><br />{member.role === 'owner' ? c.owner : c.staff}</td><td>{member.permissions.map((permission: string) => c[permission as 'menu' | 'pages' | 'cards' | 'analytics']).join(', ') || '—'}</td><td><ActionForm action={removeAdminMember} submitLabel={c.remove} confirmMessage={c.confirmRemove}><input type="hidden" name="organization_id" value={id} /><input type="hidden" name="user_id" value={member.user_id} /></ActionForm></td></tr>)}</tbody></table></div></section></div>
    <section className="panel"><h2>{c.pages}</h2><div className="table-wrap"><table><thead><tr><th>{c.name}</th><th>ID</th><th>{c.status}</th></tr></thead><tbody>{pagesResult.data?.map(item => <tr key={item.id}><td>{item.title}</td><td><code>{item.id}</code></td><td>{item.is_published ? c.published : c.draft}</td></tr>)}</tbody></table></div><Pagination page={page} count={pagesResult.count ?? 0} path={`/admin/organizations/${id}`} /></section>
  </div>;
}
