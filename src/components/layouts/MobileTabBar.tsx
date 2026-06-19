'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BriefcaseBusiness, ClipboardList, Gauge, LayoutTemplate, Map } from 'lucide-react';
import { cn } from '@/lib/cn';

type MobileTabBarProps = {
  className?: string;
};

const tabs = [
  { href: '/dashboard', label: 'dashboard', icon: Gauge },
  { href: '/journey', label: 'journey', icon: Map },
  { href: '/content-engine', label: 'content', icon: BriefcaseBusiness },
  { href: '/funnel-builder', label: 'funnels', icon: LayoutTemplate },
  { href: '/crm', label: 'customers', icon: ClipboardList },
] as const;

export function MobileTabBar({ className }: MobileTabBarProps) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-[var(--color-border)] bg-white px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] shadow-[var(--shadow-lg)]',
        className,
      )}
    >
      {tabs.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-1 text-xs font-medium',
              active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="max-w-full truncate">{t(item.label)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
