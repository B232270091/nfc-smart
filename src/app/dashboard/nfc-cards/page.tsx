import Link from 'next/link';
import { requireOrg } from '@/lib/auth';
import { appUrl } from '@/lib/env';
import { cardUrl } from '@/lib/nfc';
import { saveCard } from '@/lib/actions/cards';
import { ActionForm, Field } from '@/components/forms';
import { CardTools } from '@/components/card-tools';
import { Pagination } from '@/components/pagination';
import { PAGE_SIZE, pageNumber } from '@/lib/pagination';
import { nfcCopy as c } from '@/lib/nfc-copy';
import type { NfcCard, Page } from '@/lib/types';

export default async function Cards({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const { supabase, organization } = await requireOrg(undefined, 'cards');
  const page = pageNumber((await searchParams).page);
  const cardsResult = await supabase.from('nfc_cards').select('*', { count: 'exact' })
    .eq('organization_id', organization.id).order('created_at', { ascending: false }).order('id')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (cardsResult.error) throw new Error(c.failure);
  const cards = (cardsResult.data || []) as NfcCard[];
  const pages: Pick<Page, 'id' | 'title' | 'is_published'>[] = [];
  for (let offset = 0; ; offset += 500) {
    const result = await supabase.from('pages').select('id,title,is_published').eq('organization_id', organization.id)
      .order('title').order('id').range(offset, offset + 499);
    if (result.error) throw new Error(c.failure);
    pages.push(...(result.data ?? []));
    if ((result.data?.length ?? 0) < 500) break;
  }
  const options = pages.map(p => <option value={p.id} key={p.id}>{p.title}{p.is_published ? '' : ` (${c.unpublished})`}</option>);
  return <>
    <div className="page-header"><div><h1>{c.title}</h1><p className="muted">{c.subtitle}</p></div></div>
    <div className="grid-2">
      <section className="panel"><h2>{c.create}</h2>{pages.length ?
        <ActionForm action={saveCard} submitLabel={c.create}>
          <input type="hidden" name="organization_id" value={organization.id} />
          <Field label={c.name} name="name" required maxLength={120} />
          <label className="field">{c.destination}<select name="page_id" required defaultValue=""><option value="" disabled>{c.unassigned}</option>{options}</select></label>
          <label><input type="checkbox" name="is_active" defaultChecked /> {c.active}</label>
        </ActionForm> : <div className="empty"><p>{c.publishFirst}</p><Link href="/dashboard/pages" className="button">{c.createPage}</Link></div>}
      </section>
      <section className="panel"><span className="badge">NTAG213</span><h2 className="section-gap">{c.writing}</h2><p className="muted">{c.instructions}</p><p className="muted">{c.attribution}</p></section>
    </div>
    <div className="stack section-gap">
      {!cards.length && <div className="panel empty"><h2>{c.none}</h2><p>{c.noneBody}</p></div>}
      {cards.map(card => <article className="panel" key={card.id} data-testid="nfc-card">
        <div className="page-header"><h2>{card.name}</h2><span className="badge">{card.is_active ? c.active : c.inactive}</span></div>
        <div className="grid-2">
          <ActionForm action={saveCard}>
            <input type="hidden" name="id" value={card.id} /><input type="hidden" name="organization_id" value={organization.id} />
            <Field label={c.name} name="name" defaultValue={card.name} required maxLength={120} />
            <label className="field">{c.destination}<select name="page_id" required defaultValue={card.page_id || ''}><option value="" disabled>{c.unassigned}</option>{options}</select></label>
            <label><input type="checkbox" name="is_active" defaultChecked={card.is_active} /> {c.active}</label>
          </ActionForm>
          <div><small className="muted">{c.code}: {card.code}</small><CardTools url={cardUrl(appUrl(), card.code)} name={card.name} /></div>
        </div>
      </article>)}
    </div>
    <Pagination page={page} count={cardsResult.count ?? 0} path="/dashboard/nfc-cards" />
  </>;
}