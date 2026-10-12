import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { hasSupabase } from '@/lib/env';
import type { Membership, Organization, Permission } from '@/lib/types';
import { canManage } from '@/lib/permissions';
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
  const active = orgId || (await cookies()).get('active_org')?.value;
  let query = supabase.from('organization_members').select('*').eq('user_id', user.id);
  if (active) query = query.eq('organization_id', active);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw new Error('Байгууллагын эрхийг шалгаж чадсангүй.');
  if (!data) { if (orgId) throw new Error('Хандах эрх хүрэлцэхгүй.'); redirect('/dashboard/organizations'); }
  const membership = data as Membership;
  if (!canManage(membership, permission)) throw new Error('Энэ үйлдлийг хийх эрх хүрэлцэхгүй.');
  const { data: organization, error: orgError } = await supabase.from('organizations').select('*').eq('id', membership.organization_id).single();
  if (orgError || !organization) throw new Error('Байгууллага олдсонгүй.');
  return { supabase, user, organization: organization as Organization, membership };
}
export async function requireAdmin() {
  const context = await requireUser();
  const { data, error } = await context.supabase.rpc('is_platform_admin');
  if (error || !data) redirect('/dashboard');
  return context;
}
