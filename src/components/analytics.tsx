import type { Analytics } from '@/lib/analytics';
import { formatCount } from '@/lib/analytics';
import { adminCopy as c } from '@/lib/admin-copy';
import { Field } from '@/components/forms';

export function AnalyticsFilters({ from, to, organizationId, organizations }: { from: string; to: string; organizationId?: string; organizations?: { id: string; name: string }[] }) {
  return <form className="panel grid-3" method="get">
    <Field label={c.from} name="from" type="date" defaultValue={from} required />
    <Field label={c.to} name="to" type="date" defaultValue={to} required />
    {organizations && <label className="field"><span>{c.organization}</span><select name="organization" defaultValue={organizationId ?? ''}><option value="">{c.allOrganizations}</option>{organizations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>}
    <div><button className="button" type="submit">{c.apply}</button></div>
  </form>;
}
export function AnalyticsView({ data, showOrganizations = false }: { data: Analytics; showOrganizations?: boolean }) {
  const maximum = Math.max(1, ...data.days.map(day => day.opens));
  const metrics = [[c.recordedOpens, data.totals.opens], [c.qr, data.totals.qr], [c.unknown, data.totals.unknown], [c.activeCards, data.totals.active_cards], [c.inactiveCards, data.totals.inactive_cards]] as const;
  return <div className="stack section-gap">
    <div className="grid-3">{metrics.map(([label, value]) => <section className="panel" key={label}><div className="metric-label">{label}</div><div className="metric">{formatCount(value)}</div></section>)}</div>
    <p className="muted">{c.currentCardCounts}</p>
    <section className="panel"><h2>{c.daily}</h2><p className="muted">{c.timezone}</p>{data.totals.opens === 0 && <p className="empty">{c.noOpens}</p>}
      <div className="chart" role="img" aria-label={`${c.daily}: ${formatCount(data.totals.opens)}`}>
        {data.days.map(day => <div className="chart-bar" key={day.date} style={{ height: `${Math.max(day.opens ? 3 : 0.5, day.opens / maximum * 100)}%`, opacity: day.opens ? 1 : 0.15 }} title={`${day.date}: ${formatCount(day.opens)}`} />)}
      </div><div className="actions muted" style={{ justifyContent: 'space-between', marginTop: 10 }}><small>{data.days[0]?.date}</small><small>{data.days.at(-1)?.date}</small></div>
      <details className="section-gap"><summary>{c.chartTable}</summary><div className="table-wrap"><table><thead><tr><th>{c.created}</th><th>{c.recordedOpens}</th><th>{c.qr}</th><th>{c.unknown}</th></tr></thead><tbody>{data.days.map(day => <tr key={day.date}><td>{day.date}</td><td>{formatCount(day.opens)}</td><td>{formatCount(day.qr)}</td><td>{formatCount(day.unknown)}</td></tr>)}</tbody></table></div></details>
    </section>
    <section className="panel"><h2>{c.cardPerformance}</h2>{data.card_count > 100 && <p className="muted">{c.top100}</p>}{!data.cards.length ? <p className="empty">{c.noRecords}</p> : <div className="table-wrap"><table><thead><tr><th>{c.name}</th><th>{c.recordedOpens}</th><th>{c.qr}</th><th>{c.unknown}</th></tr></thead><tbody>{data.cards.map(card => <tr key={`${card.organization_id}:${card.id}`}><td>{card.name ?? c.transferredCard}{card.code && <small className="muted" style={{ display: 'block' }}>{card.code}</small>}</td><td>{formatCount(card.opens)}</td><td>{formatCount(card.qr)}</td><td>{formatCount(card.unknown)}</td></tr>)}</tbody></table></div>}</section>
    {showOrganizations && <section className="panel"><h2>{c.orgPerformance}</h2>{data.organization_count > 100 && <p className="muted">{c.top100}</p>}<div className="table-wrap"><table><thead><tr><th>{c.organization}</th><th>{c.recordedOpens}</th><th>{c.qr}</th><th>{c.unknown}</th></tr></thead><tbody>{data.organizations.map(org => <tr key={org.id}><td>{org.name}</td><td>{formatCount(org.opens)}</td><td>{formatCount(org.qr)}</td><td>{formatCount(org.unknown)}</td></tr>)}</tbody></table></div></section>}
    <p className="muted">{c.privacy}</p>
  </div>;
}
