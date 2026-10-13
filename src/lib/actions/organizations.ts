'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { withAction,type ActionState } from './shared';
import { createOrganizationSchema, organizationIdSchema } from '@/lib/organization-schema';
import { organizationCopy as c } from '@/lib/organization-copy';

async function rememberOrganization(id: string) {
  (await cookies()).set('active_org', id, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' });
}
export async function createOrganization(_: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const { supabase } = await requireUser();
    const { name, slug } = createOrganizationSchema.parse(Object.fromEntries(form));
    // Ownership is assigned atomically by auth.uid(), never by submitted fields.
    const { data, error } = await supabase.rpc('create_organization', { p_name: name, p_slug: slug });
    if (error) throw new Error(error.code === '23505' ? c.duplicate : c.createError);
    const result = organizationIdSchema.safeParse(data);
    if (!result.success) throw new Error(c.createError);
    await rememberOrganization(result.data);
    redirect('/dashboard');
  });
}
export async function selectOrganization(_: ActionState, form: FormData): Promise<ActionState> {
  return withAction(async () => {
    const { supabase, user } = await requireUser();
    const orgId = organizationIdSchema.parse(form.get('organization_id'));
    const { data, error } = await supabase.from('organization_members').select('organization_id').eq('organization_id', orgId).eq('user_id', user.id).maybeSingle();
    if (error) throw new Error(c.switchError);
    if (!data) throw new Error(c.denied);
    await rememberOrganization(orgId);
    redirect('/dashboard');
  });
}
