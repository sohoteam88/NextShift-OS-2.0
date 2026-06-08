'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Brain,
  CreditCard,
  Activity,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/platform-admin',             label: 'Overview',      icon: LayoutDashboard, exact: true },
  { href: '/platform-admin/tenants',     label: 'Tenants',       icon: Building2 },
  { href: '/platform-admin/users',       label: 'Users',         icon: Users },
  { href: '/platform-admin/ai-usage',    label: 'AI Usage',      icon: Brain },
  { href: '/platform-admin/billing',     label: 'Billing',       icon: CreditCard },
  { href: '/platform-admin/health',      label: 'System Health', icon: Activity },
  { href: '/platform-admin/audit-logs',  label: 'Audit Logs',    icon: ScrollText },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('admin-sidebar-collapsed') === 'true');
    } catch {}
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    try { localStorage.setItem('admin-sidebar-collapsed', String(next)); } catch {}
  }

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside
      className={cn(
        'relative flex h-screen shrink-0 flex-col border-r border-slate-800 bg-slate-900 transition-[width] duration-200',
        collapsed ? 'w-14' : 'w-[220px]',
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-slate-800',
          collapsed ? 'justify-center px-0' : 'gap-3 px-4',
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-500 text-xs font-bold text-white">
          N
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-white">Admin Console</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <div key={item.href} className="group relative">
                <Link
                  href={item.href}
                  className={cn(
                    'flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100',
                    collapsed && 'justify-center px-0',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
                {/* Hover tooltip when collapsed */}
                {collapsed && (
                  <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Divider */}
        <div className="my-3 border-t border-slate-800" />

        {/* Back to app */}
        <div className="group relative">
          <Link
            href="/dashboard"
            className={cn(
              'flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300',
              collapsed && 'justify-center px-0',
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Back to App</span>}
          </Link>
          {collapsed && (
            <div className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-700 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              Back to App
            </div>
          )}
        </div>
      </nav>

      {/* Footer: user + collapse toggle */}
      <div className="shrink-0 border-t border-slate-800 p-2 space-y-1">
        {!collapsed && (
          <div className="flex items-center gap-2 rounded-md px-2.5 py-1.5">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <span className="truncate text-xs text-slate-400">{userName}</span>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          className={cn(
            'flex h-8 w-full items-center rounded-md text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300',
            collapsed ? 'justify-center' : 'gap-2 px-2.5',
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
