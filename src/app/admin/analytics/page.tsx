import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { dateRange, loadAnalytics, textParam, type SearchParams } from '@/lib/analytics';
import { AnalyticsFilters, AnalyticsView } from '@/components/analytics';
import { adminCopy as c } from '@/lib/admin-copy';
import { organizationOptions } from '../_components';

export default async function AdminAnalytics({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const range = dateRange(params);
  const organizationId = textParam(params.organization);
  if (organizationId && !z.uuid().safeParse(organizationId).success) throw new Error(c.invalid);
  const [data, organizations] = await Promise.all([loadAnalytics(supabase, organizationId || null, range.from, range.to), organizationOptions(supabase)]);
  return <><div className="page-header"><h1>{c.analytics}</h1></div><AnalyticsFilters {...range} organizationId={organizationId} organizations={organizations} /><AnalyticsView data={data} showOrganizations /></>;
}
