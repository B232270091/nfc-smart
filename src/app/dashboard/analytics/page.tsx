import { requireOrg } from '@/lib/auth';
import { dateRange, loadAnalytics, type SearchParams } from '@/lib/analytics';
import { AnalyticsFilters, AnalyticsView } from '@/components/analytics';
import { adminCopy as c } from '@/lib/admin-copy';

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase, organization } = await requireOrg(undefined, 'analytics');
  const range = dateRange(await searchParams);
  const data = await loadAnalytics(supabase, organization.id, range.from, range.to);
  return <><div className="page-header"><div><h1>{c.analytics}</h1><p className="muted">{organization.name}</p></div></div>
    {(!process.env.SUPABASE_SECRET_KEY || !process.env.ANALYTICS_HMAC_SECRET) && <p className="alert error" style={{ marginBottom: 20 }}>{c.analyticsUnavailable}</p>}
    <AnalyticsFilters {...range} /><AnalyticsView data={data} />
  </>;
}
