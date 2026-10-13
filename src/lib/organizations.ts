import 'server-only';
import { cache } from 'react';
import { requireUser } from '@/lib/auth';
import { organizationCopy as c } from '@/lib/organization-copy';
import type { Organization } from '@/lib/types';
export type OrganizationWorkspace = {
  organization_id: string;
  role: 'owner' | 'staff';
  organizations: Pick<Organization, 'id' | 'name' | 'slug' | 'description' | 'logo_path' | 'phone' | 'email' | 'is_active' | 'primary_color'>;
};
// Request memoization only; the caller's verified session and RLS apply to every request.
export const listWorkspaces = cache(async (): Promise<OrganizationWorkspace[]> => {
  const { supabase, user } = await requireUser();
  const rows: OrganizationWorkspace[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await supabase.from('organization_members')
      .select('organization_id,role,organizations!inner(id,name,slug,description,logo_path,phone,email,is_active,primary_color)')
      .eq('user_id', user.id).order('organization_id').range(offset, offset + 99);
    if (error) throw new Error(c.readError);
    rows.push(...(data as unknown as OrganizationWorkspace[]));
    if (data.length < 100) break;
  }
  return rows;
});
