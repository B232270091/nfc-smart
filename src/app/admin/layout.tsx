import Link from 'next/link';
import { Nfc, LayoutDashboard, Building2, Users, ChartNoAxesCombined, Settings, ArrowLeft, LogOut } from 'lucide-react';
import { requireAdmin } from '@/lib/auth';
import { logout } from '@/lib/actions/auth';
import { ThemeToggle } from '@/components/theme-toggle';
import { adminCopy as c } from '@/lib/admin-copy';
import { DashboardShell } from '@/components/dashboard-shell';
import { mn } from '@/lib/copy';

export const dynamic = 'force-dynamic';
const links = [['/admin', c.overview, LayoutDashboard], ['/admin/organizations', c.organizations, Building2], ['/admin/users', c.users, Users], ['/admin/nfc-cards', c.cards, Nfc], ['/admin/analytics', c.analytics, ChartNoAxesCombined], ['/admin/settings', c.settings, Settings]] as const;
function Navigation() { return <nav>{links.map(([href, label, Icon]) => <Link key={href} href={href} className="nav-link" aria-label={label} title={label}><Icon size={18} /><span>{label}</span></Link>)}</nav>; }
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin();
  return <DashboardShell><aside className="sidebar" id="workspace-sidebar"><Link className="brand" href="/" aria-label="NFC Smart"><span className="brand-icon"><Nfc size={24} /></span><span className="brand-name">NFC Smart</span></Link><span className="badge sidebar-caption">{c.title}</span><Navigation /><div className="sidebar-footer"><Link href="/dashboard" className="nav-link" aria-label={c.back} title={c.back}><ArrowLeft size={18} /><span>{c.back}</span></Link><form action={logout}><button className="nav-link" aria-label={mn.logout} title={mn.logout}><LogOut size={18} /><span>{mn.logout}</span></button></form></div></aside><div className="dashboard-body"><header className="topbar"><span>{c.title}</span><div className="actions"><ThemeToggle /><span className="muted user-email">{user.email}</span></div><details className="mobile-nav"><summary>{c.title}</summary><Navigation /><Link href="/dashboard" className="nav-link">{c.back}</Link><form action={logout}><button className="nav-link">{mn.logout}</button></form></details></header><main className="workspace">{children}</main></div></DashboardShell>;
}
