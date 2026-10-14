'use client';

import { useState, type ReactNode } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { interfaceCopy as c } from '@/lib/interface-copy';

export function DashboardShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
    <button className="sidebar-toggle" type="button" aria-expanded={!collapsed} aria-controls="workspace-sidebar"
      aria-label={collapsed ? c.expand : c.collapse} title={collapsed ? c.expand : c.collapse}
      onClick={() => setCollapsed(value => !value)}>
      {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
    </button>
    {children}
  </div>;
}
