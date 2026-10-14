import { requireAdmin } from '@/lib/auth';
import { hasSupabase, appUrl } from '@/lib/env';
import { adminCopy as c } from '@/lib/admin-copy';

export default async function AdminSettings() {
  await requireAdmin();
  const settings = [[c.database, hasSupabase()], [c.serverKey, !!process.env.SUPABASE_SECRET_KEY], [c.analyticsKey, !!process.env.ANALYTICS_HMAC_SECRET]] as const;
  return <div className="stack"><div className="page-header"><div><h1>{c.settings}</h1><p className="muted">{c.environmentHelp}</p></div></div><section className="panel"><h2>{c.configuration}</h2><dl className="stack"><div><dt className="muted">{c.publicApp}</dt><dd>{appUrl()}</dd></div>{settings.map(([label, ready]) => <div key={label}><dt className="muted">{label}</dt><dd>{ready ? c.configured : c.missing}</dd></div>)}</dl></section><section className="panel"><h2>{c.members}</h2><p className="muted">{c.bootstrap}</p></section></div>;
}
