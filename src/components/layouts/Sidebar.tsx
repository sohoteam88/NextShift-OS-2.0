import Link from 'next/link';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/crm', label: 'CRM' },
  { href: '/funnel', label: 'Funnel' },
  { href: '/ai', label: 'AI' },
  { href: '/member', label: 'Member' },
  { href: '/team', label: 'Team' },
  { href: '/admin', label: 'Admin' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/settings', label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="hidden min-h-screen w-64 border-r border-border bg-white px-4 py-6 md:block">
      <Link href="/dashboard" className="block text-lg font-semibold">
        NextShift OS
      </Link>
      <nav className="mt-8 space-y-1">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
