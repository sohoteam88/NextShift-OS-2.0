'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useFollowupCounts } from '@/modules/crm/hooks/use-followup';
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  ClipboardList,
  Gauge,
  KanbanSquare,
  LayoutTemplate,
  Mic,
  CircleHelp,
  Settings,
  Shield,
  Users,
  Rows3,
  UserCheck,
  Wand2,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type Role = 'member' | 'leader' | 'operator' | 'platform_admin';

type SidebarProps = {
  className?: string;
  role?: Role;
  tenantName?: string;
  tenantLogoUrl?: string | null;
};

const roleRank: Record<Role, number> = {
  member: 1,
  leader: 2,
  operator: 3,
  platform_admin: 4,
};

const navItems = [
  { href: '/dashboard', label: 'dashboard', icon: Gauge, minRole: 'member' },
  { href: '/crm', label: 'leads', icon: ClipboardList, minRole: 'member' },
  { href: '/crm/pipeline', label: 'pipeline', icon: KanbanSquare, minRole: 'member' },
  { href: '/funnel', label: 'funnels', icon: LayoutTemplate, minRole: 'member' },
  { href: '/ai', label: 'aiTools', icon: Wand2, minRole: 'member' },
  { href: '/member', label: 'dailyActions', icon: Activity, minRole: 'member' },
  { href: '/member?view=training', label: 'training', icon: ClipboardList, minRole: 'member' },
  { href: '/member/voice', label: 'voiceCapture', icon: Mic, minRole: 'member' },
  { type: 'divider', minRole: 'leader' },
  { href: '/team', label: 'team', icon: Users, minRole: 'leader' },
  { href: '/team/members', label: 'teamMembers', icon: Rows3, minRole: 'leader' },
  { href: '/admin/approvals', label: 'approvals', icon: UserCheck, minRole: 'leader' },
  { href: '/analytics', label: 'analytics', icon: BarChart3, minRole: 'member' },
  { type: 'divider', minRole: 'member' },
  { href: '/help', label: 'help', icon: CircleHelp, minRole: 'member' },
  { href: '/settings', label: 'settings', icon: Settings, minRole: 'member' },
  { type: 'divider', minRole: 'operator' },
  { href: '/admin', label: 'admin', icon: Shield, minRole: 'operator' },
  { href: '/admin/users', label: 'adminUsers', icon: Users, minRole: 'operator' },
  { href: '/admin/templates', label: 'adminTemplates', icon: LayoutTemplate, minRole: 'operator' },
  { href: '/admin/daily-actions', label: 'adminDailyActions', icon: ClipboardList, minRole: 'operator' },
  { href: '/admin/training', label: 'adminTraining', icon: BookOpenCheck, minRole: 'operator' },
  { href: '/admin/plan', label: 'adminPlan', icon: Gauge, minRole: 'operator' },
  { href: '/admin/settings', label: 'adminSettings', icon: Settings, minRole: 'operator' },
] as const;

function canView(role: Role, minRole: Role) {
  return roleRank[role] >= roleRank[minRole];
}

export function Sidebar({ className, role = 'operator', tenantName, tenantLogoUrl }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isTrainingView = searchParams.get('view') === 'training';
  const t = useTranslations('nav');
  const { data: counts } = useFollowupCounts();
  const { data: pendingCountData } = useQuery({
    queryKey: ['member-pending-count', role],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/pending');
      if (!res.ok) throw new Error('Failed to load pending members');
      return res.json() as Promise<{ meta: { total: number } }>;
    },
    enabled: role !== 'member',
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
  const overdueCount = counts?.data.overdue ?? 0;
  const pendingCount = pendingCountData?.meta.total ?? 0;

  function isActiveItem(href: string) {
    const [itemPath, queryString = ''] = href.split('?');
    const queryMatches = queryString
      ? queryString.split('&').every((pair) => {
          const [key, value] = pair.split('=');
          return searchParams.get(key) === (value ?? '');
        })
      : true;

    if (!queryMatches) return false;

    if (itemPath === '/member') {
      return pathname === '/member' && (!queryString ? !isTrainingView : true);
    }

    if (itemPath === '/team/members' || itemPath === '/admin/approvals') {
      return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
    }

    if (itemPath === '/crm') {
      return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
    }

    if (itemPath === '/admin' || itemPath === '/platform-admin') {
      return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
    }

    return pathname === itemPath;
  }

  return (
    <aside
      className={cn(
        'h-screen w-[240px] shrink-0 border-r border-[var(--color-border)] bg-white px-3 py-5',
        className,
      )}
    >
      <Link href="/dashboard" className="flex h-10 items-center gap-2 px-3 text-base font-semibold text-[var(--color-text)]">
        {tenantLogoUrl ? (
          <span className="relative h-8 w-8 overflow-hidden rounded-[var(--radius-md)]">
            <Image
              src={tenantLogoUrl}
              alt={tenantName ? `${tenantName} logo` : 'Tenant logo'}
              fill
              unoptimized
              sizes="32px"
              className="object-cover"
            />
          </span>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-xs font-semibold text-white">
            NS
          </div>
        )}
        <span className="truncate">{tenantName ?? 'NextShift'}</span>
      </Link>
      <nav className="mt-6 space-y-1">
        {navItems.map((item, index) => {
          if (!canView(role, item.minRole)) return null;

          if ('type' in item) {
            return <div key={`${item.type}-${index}`} className="my-3 border-t border-[var(--color-border)]" />;
          }

          const Icon = item.icon;
          const active = isActiveItem(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">{t(item.label)}</span>
              {item.href === '/crm' && overdueCount > 0 && (
                <span className="ml-auto rounded-full bg-[var(--color-danger)] px-1.5 py-0.5 text-xs font-bold text-white">
                  {overdueCount}
                </span>
              )}
        {item.href === '/admin/approvals' && pendingCount > 0 && (
                <span className="ml-auto rounded-full bg-[var(--color-danger)] px-1.5 py-0.5 text-xs font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}

        {canView(role, 'platform_admin') && (
          <>
            <div className="my-3 border-t border-[var(--color-border)]" />
            <p className="px-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('platformAdmin')}
            </p>
            <Link
              href="/platform-admin"
              className={cn(
                'mt-1 flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors',
                pathname === '/platform-admin'
                  ? 'bg-blue-50 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
              )}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">{t('allTenants')}</span>
            </Link>
            <Link
              href="/platform-admin/health"
              className={cn(
                'flex h-10 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors',
                pathname === '/platform-admin/health'
                  ? 'bg-blue-50 text-[var(--color-primary)]'
                  : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
              )}
            >
              <Gauge className="h-4 w-4" aria-hidden="true" />
              <span className="flex-1">{t('systemHealth')}</span>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
