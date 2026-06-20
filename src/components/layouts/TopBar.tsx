'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { LanguageSwitcher } from '@/components/molecules/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/cn';
import {
  EXECUTION_ROADMAP_STEPS,
  getExecutionRoadmapLabel,
  isExecutionRoadmapStepActive,
} from '@/modules/mission/constants/execution-roadmap';

type Role = 'member' | 'leader' | 'operator' | 'platform_admin';

type TopBarProps = {
  className?: string;
  userName?: string;
  userRole?: Role;
  tenantName?: string;
  tenantLogoUrl?: string | null;
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
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] px-2 hover:bg-[var(--color-surface)]"
        aria-label="User menu"
        aria-expanded={open}
      >
        <Avatar name={userName} size="sm" />
        <span className="hidden text-sm font-medium text-[var(--color-text)] sm:inline">{userName}</span>
        <ChevronDown
          className={cn(
            'hidden h-3.5 w-3.5 text-[var(--color-text-muted)] transition-transform sm:block',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white py-1 shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              router.push('/settings');
            }}
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
      ) : null}
    </div>
  );
}

export function TopBar({
  className,
  userName = 'User',
  userRole = 'member',
  tenantName = 'NextShift',
  tenantLogoUrl,
}: TopBarProps) {
  const nav = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  void userRole;
  const topNav = EXECUTION_ROADMAP_STEPS;

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex min-h-16 min-w-0 items-center gap-3 border-b border-[var(--color-border)] bg-white px-4 lg:px-6',
        className,
      )}
    >
      <Link href="/dashboard" className="flex min-w-0 shrink-0 items-center gap-2">
        {tenantLogoUrl ? (
          <span className="relative h-8 w-8 overflow-hidden rounded-[var(--radius-md)]">
            <Image src={tenantLogoUrl} alt={`${tenantName} logo`} fill unoptimized sizes="32px" className="object-cover" />
          </span>
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-xs font-semibold text-white">
            NS
          </span>
        )}
        <span className="hidden max-w-36 truncate text-sm font-semibold text-[var(--color-text)] sm:inline">
          {tenantName}
        </span>
      </Link>

      <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto xl:flex" aria-label="Primary navigation">
        {topNav.map((item) => {
          const active = isExecutionRoadmapStepActive(item, pathname);
          return (
            <Link
              key={item.id}
              href={item.route}
              className={cn(
                'inline-flex h-10 shrink-0 items-center rounded-[var(--radius-md)] px-2 text-xs font-semibold transition-colors',
                active
                  ? 'bg-blue-50 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
              )}
            >
              {getExecutionRoadmapLabel(item, locale, true)}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <LanguageSwitcher />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={<Settings className="h-4 w-4" aria-hidden="true" />}
          aria-label={nav('settings')}
          onClick={() => router.push('/settings')}
          className="hidden h-10 w-10 sm:inline-flex xl:hidden"
        />
        <UserMenu userName={userName} />
      </div>
    </header>
  );
}
