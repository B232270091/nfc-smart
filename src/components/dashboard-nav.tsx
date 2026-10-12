'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard,Building2,UtensilsCrossed,FileText,Nfc,ChartNoAxesCombined,Settings } from 'lucide-react';
import { mn } from '@/lib/copy';
const links=[['/dashboard',mn.dashboard,LayoutDashboard],['/dashboard/organizations',mn.organizations,Building2],['/dashboard/menu',mn.menu,UtensilsCrossed],['/dashboard/pages',mn.pages,FileText],['/dashboard/nfc-cards',mn.cards,Nfc],['/dashboard/analytics',mn.analytics,ChartNoAxesCombined],['/dashboard/settings',mn.settings,Settings]] as const;
export function DashboardNav(){const path=usePathname();return <nav>{links.map(([href,title,Icon])=><Link key={href} href={href} className={`nav-link ${path===href||(href!='/dashboard'&&path.startsWith(href+'/'))?'active':''}`}><Icon size={18}/>{title}</Link>)}</nav>;}
