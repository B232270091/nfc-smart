import { messages } from '@/lib/messages/mn';
import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasSupabase } from '@/lib/env';
import type { Membership, Organization, Permission } from '@/lib/types';
import { canManage } from '@/lib/permissions';
import { organizationIdSchema } from '@/lib/organization-schema';
export { canManage } from '@/lib/permissions';
export async function requireUser() {
  if (!hasSupabase()) redirect('/setup');
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  return { supabase, user };
}
export async function requireOrg(orgId?: string, permission?: Permission | 'owner') {
  const { supabase, user } = await requireUser();
  if (orgId && !organizationIdSchema.safeParse(orgId).success) throw new Error(messages.libAuth.message);
  const cookieId = (await cookies()).get('active_org')?.value;
  const active = orgId || (organizationIdSchema.safeParse(cookieId).success ? cookieId : undefined);
  let query = supabase.from('organization_members').select('*').eq('user_id', user.id).order('organization_id');
  if (active) query = query.eq('organization_id', active);
  let { data, error } = await query.limit(1).maybeSingle();
  // A removed membership can leave a stale preference cookie. It never grants access.
  if (!error && !data && active && !orgId) {
    const fallback = await supabase.from('organization_members').select('*').eq('user_id', user.id).order('organization_id').limit(1).maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }
  if (error) throw new Error(messages.libAuth.message2);
  if (!data) { if (orgId) throw new Error(messages.libAuth.message3); redirect('/dashboard/organizations'); }
  const membership = data as Membership;
  if (!canManage(membership, permission)) throw new Error(messages.libAuth.message4);
  const { data: organization, error: orgError } = await supabase.from('organizations').select('*').eq('id', membership.organization_id).single();
  if (orgError || !organization) throw new Error(messages.libAuth.message5);
  return { supabase, user, organization: organization as Organization, membership };
}
export async function requireAdmin() {
  const context = await requireUser();
  const { data, error } = await context.supabase.rpc('is_platform_admin');
  if (error || !data) redirect('/dashboard');
  return context;
}
