'use client';

import type { ElementType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Bot, DollarSign, Fingerprint, Gauge, LayoutTemplate, Map, MessageCircle, Settings, UsersRound } from 'lucide-react';
import { cn } from '@/lib/cn';

type MobileTabBarProps = {
  activationMode?: boolean;
  className?: string;
};

type TabItem = {
  href: string;
  label_zh: string;
  label_en: string;
  label_ms: string;
  icon: ElementType;
};

const activationTabs: TabItem[] = [
  { href: '/dashboard', label_zh: '首页', label_en: 'Home', label_ms: 'Utama', icon: Gauge },
  { href: '/journey', label_zh: '旅程', label_en: 'Journey', label_ms: 'Perjalanan', icon: Map },
  { href: '/brand-builder/step/interview', label_zh: '访谈', label_en: 'Interview', label_ms: 'Temu Bual', icon: MessageCircle },
  { href: '/brand-builder/step/profile', label_zh: 'Brand DNA', label_en: 'Brand DNA', label_ms: 'DNA Jenama', icon: Fingerprint },
  { href: '/settings', label_zh: '设置', label_en: 'Settings', label_ms: 'Tetapan', icon: Settings },
];

const growthTabs: TabItem[] = [
  { href: '/dashboard', label_zh: '首页', label_en: 'Home', label_ms: 'Utama', icon: Gauge },
  { href: '/revenue-drivers', label_zh: '收入', label_en: 'Revenue', label_ms: 'Hasil', icon: DollarSign },
  { href: '/funnel', label_zh: '漏斗', label_en: 'Funnel', label_ms: 'Funnel', icon: LayoutTemplate },
  { href: '/leads', label_zh: 'Leads', label_en: 'Leads', label_ms: 'Prospek', icon: UsersRound },
  { href: '/ai-workforce', label_zh: 'Team', label_en: 'Team', label_ms: 'Pasukan', icon: Bot },
];

function labelFor(item: TabItem, locale: string) {
  if (locale.startsWith('ms')) return item.label_ms;
  if (locale.startsWith('en')) return item.label_en;
  return item.label_zh;
}

export function MobileTabBar({ activationMode = false, className }: MobileTabBarProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const tabs = activationMode ? activationTabs : growthTabs;

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
            <span className="max-w-full truncate">{labelFor(item, locale)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
