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
  Brain,
  Calendar,
  ClipboardList,
  Gauge,
  ImageIcon,
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
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type Role = 'member' | 'leader' | 'operator' | 'platform_admin';

type SidebarProps = {
  className?: string;
  role?: Role;
  tenantName?: string;
  tenantLogoUrl?: string | null;
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
};

type NavSection = {
  title: string;
  minRole: Role;
  items: NavItem[];
};

const roleRank: Record<Role, number> = {
  member: 1,
  leader: 2,
  operator: 3,
  platform_admin: 4,
};

function canView(role: Role, minRole: Role) {
  return roleRank[role] >= roleRank[minRole];
}

// ─── Navigation structure ─────────────────────────────────────────────────────

const MEMBER_SECTIONS: NavSection[] = [
  {
    title: '赚钱行动',
    minRole: 'member',
    items: [
      { href: '/dashboard', label: 'dashboard', icon: Gauge },
      { href: '/member', label: 'dailyActions', icon: Activity },
      { href: '/ai/coach', label: 'aiCoach', icon: Brain },
    ],
  },
  {
    title: '引流内容',
    minRole: 'member',
    items: [
      { href: '/ai', label: 'aiTools', icon: Wand2 },
      { href: '/ai/content-plan', label: 'contentPlan', icon: Calendar },
      { href: '/ai/image', label: 'aiImage', icon: ImageIcon },
      { href: '/member/voice', label: 'voiceCapture', icon: Mic },
    ],
  },
  {
    title: '成交系统',
    minRole: 'member',
    items: [
      { href: '/funnel', label: 'funnels', icon: LayoutTemplate },
      { href: '/ai/funnel-builder', label: 'funnelBuilder', icon: Zap },
      { href: '/crm', label: 'leads', icon: ClipboardList },
      { href: '/crm/pipeline', label: 'pipeline', icon: KanbanSquare },
      { href: '/crm/customers', label: 'customers', icon: UserCheck },
    ],
  },
  {
    title: '学习成长',
    minRole: 'member',
    items: [
      { href: '/member?view=training', label: 'training', icon: BookOpenCheck },
    ],
  },
  {
    title: '系统',
    minRole: 'member',
    items: [
      { href: '/analytics', label: 'analytics', icon: BarChart3 },
      { href: '/settings', label: 'settings', icon: Settings },
      { href: '/help', label: 'help', icon: CircleHelp },
    ],
  },
];

const LEADER_ITEMS: NavItem[] = [
  { href: '/team', label: 'team', icon: Users },
  { href: '/team/members', label: 'teamMembers', icon: Rows3 },
  { href: '/admin/approvals', label: 'approvals', icon: UserCheck },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: '/admin', label: 'admin', icon: Shield },
  { href: '/admin/users', label: 'adminUsers', icon: Users },
  { href: '/admin/templates', label: 'adminTemplates', icon: LayoutTemplate },
  { href: '/admin/daily-actions', label: 'adminDailyActions', icon: ClipboardList },
  { href: '/admin/training', label: 'adminTraining', icon: BookOpenCheck },
  { href: '/admin/plan', label: 'adminPlan', icon: Gauge },
  { href: '/admin/settings', label: 'adminSettings', icon: Settings },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────

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

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const active = isActiveItem(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'flex h-9 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors',
          active
            ? 'bg-blue-50 text-[var(--color-primary)]'
            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">{t(item.label as Parameters<typeof t>[0])}</span>
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
  }

  return (
    <aside
      className={cn(
        'flex h-screen w-[240px] shrink-0 flex-col border-r border-[var(--color-border)] bg-white px-3 py-5',
        className,
      )}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex h-10 shrink-0 items-center gap-2 px-3 text-base font-semibold text-[var(--color-text)]"
      >
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

      <nav className="mt-5 flex-1 overflow-y-auto pb-4">
        {/* Member sections */}
        <div className="space-y-4">
          {MEMBER_SECTIONS.map((section) => {
            if (!canView(role, section.minRole)) return null;
            return (
              <div key={section.title}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                  {section.title}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => renderItem(item))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leader section */}
        {canView(role, 'leader') && (
          <div className="mt-4">
            <div className="mb-3 border-t border-[var(--color-border)]" />
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              团队管理
            </p>
            <div className="space-y-0.5">
              {LEADER_ITEMS.map((item) => renderItem(item))}
            </div>
          </div>
        )}

        {/* Operator/admin section */}
        {canView(role, 'operator') && (
          <div className="mt-4">
            <div className="mb-3 border-t border-[var(--color-border)]" />
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              管理后台
            </p>
            <div className="space-y-0.5">
              {ADMIN_ITEMS.map((item) => renderItem(item))}
            </div>
          </div>
        )}

        {/* Platform admin */}
        {canView(role, 'platform_admin') && (
          <div className="mt-4">
            <div className="mb-3 border-t border-[var(--color-border)]" />
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
              {t('platformAdmin')}
            </p>
            <div className="mt-1 space-y-0.5">
              <Link
                href="/platform-admin"
                className={cn(
                  'flex h-9 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors',
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
                  'flex h-9 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors',
                  pathname === '/platform-admin/health'
                    ? 'bg-blue-50 text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
                )}
              >
                <Gauge className="h-4 w-4" aria-hidden="true" />
                <span className="flex-1">{t('systemHealth')}</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
