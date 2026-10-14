import type { SupabaseClient } from '@supabase/supabase-js';
import { adminCopy as c } from '@/lib/admin-copy';

export type Analytics = {
  totals: { opens: number; qr: number; unknown: number; active_cards: number; inactive_cards: number };
  days: { date: string; opens: number; qr: number; unknown: number }[];
  cards: { id: string; organization_id: string; name: string | null; code: string | null; is_active: boolean | null; opens: number; qr: number; unknown: number }[];
  card_count: number;
  organizations: { id: string; name: string; opens: number; qr: number; unknown: number }[];
  organization_count: number;
};
export type SearchParams = Record<string, string | string[] | undefined>;
export function textParam(value: string | string[] | undefined) { return typeof value === 'string' ? value : ''; }
export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ulaanbaatar', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function dateRange(params: SearchParams, now = new Date()) {
  const today = localDate(now);
  const start = new Date(`${today}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 29);
  const from = textParam(params.from) || start.toISOString().slice(0, 10);
  const to = textParam(params.to) || today;
  const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  const days = (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
  if (!validDate(from) || !validDate(to) || days < 0 || days > 365) throw new Error(c.dateInvalid);
  return { from, to };
}
export async function loadAnalytics(supabase: SupabaseClient, organizationId: string | null, from: string, to: string): Promise<Analytics> {
  const { data, error } = await supabase.rpc('get_analytics', { p_organization_id: organizationId, p_from: from, p_to: to });
  if (error || !data) throw new Error(c.readFailed);
  return data as Analytics;
}
export function formatCount(value: number) { return new Intl.NumberFormat('mn-MN').format(value); }
