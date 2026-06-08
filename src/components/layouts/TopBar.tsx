'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Settings, LogOut, User, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';

type TopBarProps = {
  className?: string;
  userName?: string;
};

function UserMenu({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] px-2 hover:bg-[var(--color-surface)]"
        aria-label="User menu"
        aria-expanded={open}
      >
        <Avatar name={userName} size="sm" />
        <span className="hidden text-sm font-medium text-[var(--color-text)] sm:inline">{userName}</span>
        <ChevronDown className={cn('hidden h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform sm:block', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white py-1 shadow-lg">
          <button
            onClick={() => { setOpen(false); router.push('/settings'); }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]"
          >
            <User className="h-4 w-4 text-[var(--color-text-muted)]" />
            个人设置
          </button>
          <div className="my-1 border-t border-[var(--color-border)]" />
          <button
            onClick={handleLogout}
            disabled={loading}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {loading ? '退出中...' : '退出登录'}
          </button>
        </div>
      )}
    </div>
  );
}

export function TopBar({ className, userName = 'User' }: TopBarProps) {
  const common = useTranslations('common');
  const nav = useTranslations('nav');
  const router = useRouter();

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
          onClick={() => router.push('/settings')}
          className="hidden h-10 w-10 sm:inline-flex"
        />
        <UserMenu userName={userName} />
      </div>
    </header>
  );
}
