import Link from 'next/link';
import { Nfc, LogOut, ArrowUpRight } from 'lucide-react';
import { cookies } from 'next/headers';
import { requireUser } from '@/lib/auth';
import { listWorkspaces } from '@/lib/organizations';
import { logout } from '@/lib/actions/auth';
import { selectOrganization } from '@/lib/actions/organizations';
import { DashboardNav } from '@/components/dashboard-nav';
import { ActionForm } from '@/components/forms';
import { ThemeToggle } from '@/components/theme-toggle';
import { mn } from '@/lib/copy';
import { organizationCopy as c } from '@/lib/organization-copy';
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const memberships = await listWorkspaces();
  const { data: isAdmin } = await supabase.rpc('is_platform_admin');
  const selected = (await cookies()).get('active_org')?.value;
  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="brand" href="/"><span className="brand-icon"><Nfc size={24} /></span>NFC Smart</Link>
      <div><p className="sidebar-caption">{c.workspace}</p><DashboardNav /></div>
      <div className="sidebar-footer">
        <div className="workspace-security"><Nfc size={20} /><p>{c.secure}</p></div>
        {isAdmin && <Link className="nav-link" href="/admin">{mn.admin}<ArrowUpRight size={16} /></Link>}
        <form action={logout}><button className="nav-link" type="submit"><LogOut size={17} />{mn.logout}</button></form>
        <span className="sidebar-caption">NFC Smart · Монгол</span>
      </div>
    </aside>
    <div className="dashboard-body">
      <header className="topbar">
        {memberships.length > 0 ? <ActionForm action={selectOrganization} className="workspace-switcher" submitLabel={c.select}>
          <label className="sr-only" htmlFor="workspace">{mn.switchOrg}</label>
          <select id="workspace" name="organization_id" defaultValue={memberships.some(m => m.organization_id === selected) ? selected : memberships[0].organization_id} aria-label={mn.switchOrg}>
            {memberships.map(m => <option value={m.organization_id} key={m.organization_id}>{m.organizations.name}</option>)}
          </select>
        </ActionForm> : <Link className="button button-secondary" href="/dashboard/organizations">{mn.createOrg}</Link>}
        <div className="actions"><ThemeToggle /><span className="user-email muted">{user.email}</span><span className="user-initial">{user.email?.slice(0, 1).toUpperCase()}</span></div>
        <details className="mobile-nav"><summary>{mn.dashboard}</summary><DashboardNav />
          {isAdmin && <Link href="/admin">{mn.admin}</Link>}
          <form action={logout}><button className="nav-link" type="submit">{mn.logout}</button></form>
        </details>
      </header>
      <main className="workspace">{children}</main>
    </div>
  </div>;
}
