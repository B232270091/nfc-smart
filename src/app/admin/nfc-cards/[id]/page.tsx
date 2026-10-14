import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { ActionForm, Field } from '@/components/forms';
import { updateAdminCard, transferAdminCard } from '@/lib/actions/admin';
import { adminCopy as c } from '@/lib/admin-copy';

export default async function AdminCard({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const { data: card, error } = await supabase.from('nfc_cards').select('id,name,code,page_id,organization_id,is_active').eq('id', id).maybeSingle();
  if (error) throw new Error(c.readFailed);
  if (!card) notFound();
  return <div className="stack"><div className="page-header"><div><h1>{card.name}</h1><p className="muted">{c.code}: {card.code}</p></div><Link href={`/admin/organizations/${card.organization_id}`} className="button button-secondary">{c.organization}</Link></div><div className="grid-2"><section className="panel"><ActionForm action={updateAdminCard}><input type="hidden" name="id" value={id} /><Field name="name" label={c.name} defaultValue={card.name} required maxLength={120} /><Field name="page_id" label={c.destination} defaultValue={card.page_id} required /><label className="actions"><input type="checkbox" name="is_active" defaultChecked={card.is_active} />{c.active}</label></ActionForm></section><section className="panel stack"><h2>{c.transfer}</h2><p className="muted">{c.transferDescription}</p><ActionForm action={transferAdminCard} submitLabel={c.transfer} confirmMessage={c.confirmTransfer}><input type="hidden" name="id" value={id} /><Field name="organization_id" label={c.targetOrganization} required /><Field name="page_id" label={c.targetPage} required /></ActionForm><Link href="/admin/organizations" className="button button-secondary">{c.organizations}</Link></section></div></div>;
}
