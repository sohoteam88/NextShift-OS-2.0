'use client';

import * as React from 'react';
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
  ChevronDown,
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
  LineChart,
  Clapperboard,
  MapPin,
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
  defaultOpen?: boolean;
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

const CORE_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'dashboard', icon: Gauge },
  { href: '/member', label: 'dailyActions', icon: Activity },
  { href: '/ai/coach', label: 'aiCoach', icon: Brain },
  { href: '/crm', label: 'leads', icon: ClipboardList },
  { href: '/funnel', label: 'funnels', icon: LayoutTemplate },
];

const PLATFORM_CORE_ITEMS: NavItem[] = [
  { href: '/platform-admin', label: 'allTenants', icon: Shield },
  { href: '/platform-admin/health', label: 'systemHealth', icon: Gauge },
  { href: '/platform-admin/ai-usage', label: 'aiModelUsage', icon: Brain },
  { href: '/dashboard', label: 'dashboard', icon: Gauge },
];

const MEMBER_SECTIONS: NavSection[] = [
  {
    title: 'AI 与内容',
    minRole: 'member',
    items: [
      { href: '/ai', label: 'aiTools', icon: Wand2 },
      { href: '/ai/content-plan', label: 'contentPlan', icon: Calendar },
      { href: '/ai/image', label: 'aiImage', icon: ImageIcon },
      { href: '/member/voice', label: 'voiceCapture', icon: Mic },
      { href: '/ai/funnel-builder', label: 'funnelBuilder', icon: Zap },
    ],
  },
  {
    title: '品牌建设',
    minRole: 'member',
    items: [
      { href: '/brand-builder/calendar', label: 'contentCalendar', icon: Calendar },
      { href: '/brand-builder/video-script', label: 'videoScript', icon: Clapperboard },
      { href: '/brand-builder/insights', label: 'contentInsights', icon: LineChart },
      { href: '/brand-builder/guides', label: 'platformGuides', icon: MapPin },
    ],
  },
  {
    title: '成交系统',
    minRole: 'member',
    items: [
      { href: '/crm/pipeline', label: 'pipeline', icon: KanbanSquare },
      { href: '/crm/customers', label: 'customers', icon: UserCheck },
    ],
  },
  {
    title: '学习成长',
    minRole: 'member',
    items: [
      { href: '/member?view=training', label: 'training', icon: BookOpenCheck },
      { href: '/analytics', label: 'analytics', icon: BarChart3 },
    ],
  },
  {
    title: '系统',
    minRole: 'member',
    items: [
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
  { href: '/admin/daily-actions', label: 'adminDailyActions', icon: ClipboardList },
  { href: '/admin/training', label: 'adminTraining', icon: BookOpenCheck },
  { href: '/admin/templates', label: 'adminTemplates', icon: LayoutTemplate },
  { href: '/admin/plan', label: 'adminPlan', icon: Gauge },
  { href: '/admin/settings', label: 'adminSettings', icon: Settings },
];

const PLATFORM_ITEMS: NavItem[] = [
  { href: '/platform-admin', label: 'allTenants', icon: Shield },
  { href: '/platform-admin/health', label: 'systemHealth', icon: Gauge },
  { href: '/platform-admin/ai-usage', label: 'aiModelUsage', icon: Brain },
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
  const [manualOpen, setManualOpen] = React.useState<Record<string, boolean>>({});

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

  function sectionHasActive(items: NavItem[]) {
    return items.some((item) => isActiveItem(item.href));
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

  function renderSection(section: NavSection) {
    if (!canView(role, section.minRole)) return null;

    const active = sectionHasActive(section.items);
    const open = manualOpen[section.title] ?? section.defaultOpen ?? active;

    return (
      <div key={section.title} className="rounded-[var(--radius-lg)]">
        <button
          type="button"
          onClick={() => setManualOpen((current) => ({ ...current, [section.title]: !open }))}
          className={cn(
            'flex h-8 w-full items-center justify-between rounded-[var(--radius-md)] px-3 text-xs font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
            active && 'text-[var(--color-text)]',
          )}
        >
          <span>{section.title}</span>
          <ChevronDown
            className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
            aria-hidden="true"
          />
        </button>
        {open ? <div className="mt-1 space-y-0.5">{section.items.map((item) => renderItem(item))}</div> : null}
      </div>
    );
  }

  const coreItems = role === 'platform_admin' ? PLATFORM_CORE_ITEMS : CORE_ITEMS;
  const sections: NavSection[] =
    role === 'platform_admin'
      ? [
          { title: t('platformAdmin'), minRole: 'platform_admin', defaultOpen: true, items: PLATFORM_ITEMS },
          { title: '系统', minRole: 'member', items: MEMBER_SECTIONS.find((section) => section.title === '系统')?.items ?? [] },
        ]
      : [
          ...MEMBER_SECTIONS,
          { title: '团队管理', minRole: 'leader', items: LEADER_ITEMS },
          { title: '管理后台', minRole: 'operator', items: ADMIN_ITEMS },
        ];

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
        <div>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            常用
          </p>
          <div className="space-y-0.5">{coreItems.map((item) => renderItem(item))}</div>
        </div>

        <div className="my-4 border-t border-[var(--color-border)]" />

        <div className="space-y-1">{sections.map((section) => renderSection(section))}</div>
      </nav>
    </aside>
  );
}
