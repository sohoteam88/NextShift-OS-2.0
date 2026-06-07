'use client';

import { Menu, Search, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher';
import { cn } from '@/lib/cn';

type TopBarProps = {
  className?: string;
  userName?: string;
};

export function TopBar({ className, userName = 'User' }: TopBarProps) {
  const common = useTranslations('common');
  const nav = useTranslations('nav');

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 min-w-0 items-center gap-3 border-b border-[var(--color-border)] bg-white px-4 lg:px-6',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        icon={<Menu className="h-5 w-5" aria-hidden="true" />}
        aria-label="Open navigation"
        className="h-10 w-10 lg:hidden"
      />
      <div className="relative hidden w-full min-w-0 max-w-md md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input
          type="search"
          placeholder={common('search')}
          className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-blue-100"
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<Settings className="h-4 w-4" aria-hidden="true" />}
          aria-label={nav('settings')}
          className="hidden h-10 w-10 sm:inline-flex"
        />
        <button
          type="button"
          className="flex min-h-10 min-w-10 items-center gap-2 rounded-[var(--radius-md)] px-2 hover:bg-[var(--color-surface)]"
          aria-label="User menu"
        >
          <Avatar name={userName} size="sm" />
          <span className="hidden text-sm font-medium text-[var(--color-text)] sm:inline">{userName}</span>
        </button>
      </div>
    </header>
  );
}
