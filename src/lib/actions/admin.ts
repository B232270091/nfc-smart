'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { withAction, type ActionState } from '@/lib/actions/shared';
import { adminCopy as c } from '@/lib/admin-copy';

const uuid = z.string().uuid(c.invalid);
const read = (form: FormData, name: string) => String(form.get(name) ?? '');
function changed() { revalidatePath('/admin', 'layout'); revalidatePath('/dashboard', 'layout'); revalidatePath('/p/[slug]', 'page'); }
function fail(error: { code?: string } | null) {
  if (error?.code === '23514') throw new Error(c.lastOwner);
  if (error?.code === '22023') throw new Error(c.registeredFirst);
  if (error) throw new Error(c.failed);
}
export async function updateAdminOrganization(_state: ActionState, form: FormData) {
  return withAction(async () => {
    const { supabase } = await requireAdmin();
    const values = z.object({ id: uuid, name: z.string().trim().min(2).max(120), slug: z.string().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) }).parse(Object.fromEntries(form));
    const { data, error } = await supabase.from('organizations').update({ name: values.name, slug: values.slug, is_active: form.get('is_active') === 'on' }).eq('id', values.id).select('id').single();
    if (error || !data) throw new Error(c.failed);
    changed();
  });
}
export async function upsertAdminMember(_state: ActionState, form: FormData) {
  return withAction(async () => {
    const { supabase } = await requireAdmin();
    const organizationId = uuid.parse(read(form, 'organization_id'));
    const values = z.object({ email: z.string().trim().email().max(254), role: z.enum(['owner', 'staff']), permissions: z.array(z.enum(['menu', 'pages', 'cards', 'analytics'])).max(4) }).parse({ email: read(form, 'email'), role: read(form, 'role'), permissions: form.getAll('permissions') });
    const { error } = await supabase.rpc('upsert_organization_member', { p_organization_id: organizationId, p_email: values.email, p_role: values.role, p_permissions: values.role === 'owner' ? [] : values.permissions });
    fail(error); changed();
  });
}
export async function removeAdminMember(_state: ActionState, form: FormData) {
  return withAction(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc('remove_organization_member', { p_organization_id: uuid.parse(read(form, 'organization_id')), p_user_id: uuid.parse(read(form, 'user_id')) });
    fail(error); changed();
  });
}
export async function updateAdminCard(_state: ActionState, form: FormData) {
  return withAction(async () => {
    const { supabase } = await requireAdmin();
    const values = z.object({ id: uuid, page_id: uuid, name: z.string().trim().min(1).max(120) }).parse(Object.fromEntries(form));
    const { data, error } = await supabase.from('nfc_cards').update({ name: values.name, page_id: values.page_id, is_active: form.get('is_active') === 'on' }).eq('id', values.id).select('id').single();
    if (error || !data) throw new Error(c.failed);
    changed();
  });
}
export async function transferAdminCard(_state: ActionState, form: FormData) {
  return withAction(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.rpc('reassign_nfc_card', { p_card_id: uuid.parse(read(form, 'id')), p_org_id: uuid.parse(read(form, 'organization_id')), p_page_id: uuid.parse(read(form, 'page_id')) });
    if (error) throw new Error(c.failed);
    changed();
  });
}
