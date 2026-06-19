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
  UserCog,
  DollarSign,
  FileClock,
  Map,
  Target,
  FileText,
  Megaphone,
  MessageCircle,
  Trophy,
  MessagesSquare,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { ADVANCED_SIDEBAR, EXPLORER_SIDEBAR, BUILDER_SIDEBAR, OPERATOR_SIDEBAR, type MissionSidebarItem } from '@/modules/mission/constants/sidebar-config';
import { useMissionState, useSetMode } from '@/modules/mission/hooks/use-mission';
import { useEvolutionProjection } from '@/modules/evolution/hooks/use-evolution-projection';

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

const ICONS: Record<string, React.ElementType> = {
  Activity,
  BarChart3,
  BookOpenCheck,
  Calendar,
  Clapperboard,
  ClipboardList,
  FileText,
  Gauge,
  KanbanSquare,
  LayoutTemplate,
  LineChart,
  Map,
  MapPin,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Sparkles,
  Settings,
  Target,
  Trophy,
  UserCheck,
  UserCog,
  Wand2,
  Zap,
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
  { href: '/platform-admin', label: 'ceoDashboard', icon: Shield },
  { href: '/platform-admin/revenue', label: 'platformRevenue', icon: DollarSign },
  { href: '/platform-admin/tenant-health', label: 'tenantHealth', icon: Activity },
  { href: '/platform-admin/growth', label: 'platformGrowth', icon: LineChart },
];

const MEMBER_SECTIONS: NavSection[] = [
  {
    title: 'AI 与内容',
    minRole: 'member',
    items: [
      { href: '/content-engine', label: 'aiTools', icon: Wand2 },
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
      { href: '/brand-builder/profile', label: 'brandProfile', icon: UserCog },
      { href: '/brand-builder/calendar', label: 'contentCalendar', icon: Calendar },
      { href: '/video', label: 'videoScript', icon: Clapperboard },
      { href: '/brand-builder/insights', label: 'contentInsights', icon: LineChart },
      { href: '/brand-builder/guides', label: 'platformGuides', icon: MapPin },
    ],
  },
  {
    title: '成交系统',
    minRole: 'member',
    items: [
      { href: '/crm/pipeline', label: 'pipeline', icon: KanbanSquare },
      { href: '/crm', label: 'customers', icon: UserCheck },
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
  { href: '/admin', label: 'adminCommandCenter', icon: Shield },
  { href: '/admin/operations', label: 'adminOperations', icon: ClipboardList },
  { href: '/admin/members', label: 'adminMembers', icon: Users },
  { href: '/admin/funnels', label: 'adminFunnels', icon: LayoutTemplate },
  { href: '/admin/journey', label: 'adminJourney', icon: Map },
  { href: '/admin/team', label: 'adminTeam', icon: UserCheck },
  { href: '/admin/content', label: 'adminContent', icon: FileText },
  { href: '/admin/billing', label: 'adminBilling', icon: DollarSign },
  { href: '/admin/beta', label: 'adminBeta', icon: Trophy },
  { href: '/admin/approvals', label: 'approvals', icon: UserCheck },
  { href: '/admin/settings', label: 'adminSettings', icon: Settings },
];

const PLATFORM_ITEMS: NavItem[] = [
  { href: '/platform-admin/funnels', label: 'platformFunnels', icon: LayoutTemplate },
  { href: '/platform-admin/ai-profitability', label: 'aiProfitability', icon: Brain },
  { href: '/platform-admin/beta', label: 'adminBeta', icon: Trophy },
  { href: '/platform-admin/health', label: 'systemHealth', icon: Gauge },
  { href: '/platform-admin/tenants', label: 'allTenants', icon: Shield },
  { href: '/platform-admin/users', label: 'platformUsers', icon: Users },
  { href: '/platform-admin/billing', label: 'platformBilling', icon: DollarSign },
  { href: '/platform-admin/audit-logs', label: 'platformAuditLogs', icon: FileClock },
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
  const mission = useMissionState({ enabled: role === 'member' });
  const evolution = useEvolutionProjection();
  const setMode = useSetMode();
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

    if (itemPath === '/admin') {
      return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
    }

    if (itemPath === '/platform-admin') {
      return pathname === itemPath;
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

  function renderMissionItem(item: MissionSidebarItem, nested = false) {
    const Icon = ICONS[item.icon] ?? Gauge;
    const active = isActiveItem(item.route);

    return (
      <Link
        key={`${item.route}-${item.label_zh}`}
        href={item.route}
        className={cn(
          'flex h-9 items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-colors',
          nested && 'pl-8',
          active
            ? 'bg-blue-50 text-[var(--color-primary)]'
            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
        )}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">{item.label_zh}</span>
      </Link>
    );
  }

  function renderMissionSidebar() {
    const state = mission.data?.data;
    const mode = state?.mode ?? 'guided';
    const current = state?.currentStage ?? state?.nextStage ?? null;
    const guidedCurrent: MissionSidebarItem | null = current
      ? {
          icon: 'Target',
          label_zh: current.name_zh,
          label_en: current.name_en,
          label_ms: current.name_ms,
          route: current.route,
        }
      : null;

    // Level-based sidebar selection
    const level = evolution.snapshot?.level ?? 'explorer';
    const sidebarItems: MissionSidebarItem[] =
      level === 'explorer' ? EXPLORER_SIDEBAR :
      level === 'builder' ? BUILDER_SIDEBAR :
      level === 'operator' ? OPERATOR_SIDEBAR :
      ADVANCED_SIDEBAR; // leader or platform_admin

    if (mode === 'guided' || level === 'explorer') {
      return (
        <nav className="mt-5 flex-1 overflow-y-auto pb-4">
          <div className="space-y-0.5">
            {sidebarItems.map((item) => renderMissionItem(item))}
          </div>
          {guidedCurrent ? (
            <>
              <div className="my-4 border-t border-[var(--color-border)]" />
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                当前阶段
              </p>
              {renderMissionItem(guidedCurrent)}
            </>
          ) : null}
          {level === 'explorer' && (
            <>
              <div className="my-4 border-t border-[var(--color-border)]" />
              <p className="mb-1 px-3 text-[10px] text-[var(--color-text-muted)]">
                完成品牌基础后解锁：内容引擎、客户开发、销售中心
              </p>
            </>
          )}
          <div className="my-4 border-t border-[var(--color-border)]" />
          <button
            type="button"
            onClick={() => {
              const confirmed = window.confirm('切换到高级模式后，AI 教练仍会在仪表盘提示下一步，但你可以自由跳转到任何功能。');
              if (confirmed) setMode.mutate('advanced');
            }}
            className="flex h-9 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            更多功能（到仪表盘切换高级模式）
          </button>
        </nav>
      );
    }

    return (
      <nav className="mt-5 flex-1 overflow-y-auto pb-4">
        <div className="space-y-0.5">
          {sidebarItems.slice(0, 2).map((item) => renderMissionItem(item))}
        </div>
        <div className="my-4 border-t border-[var(--color-border)]" />
        <div className="space-y-3">
          {sidebarItems.slice(2).map((item) =>
            item.children ? (
              <div key={item.label_zh}>
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                  {item.label_zh}
                </p>
                <div className="space-y-0.5">{item.children.map((child) => renderMissionItem(child, true))}</div>
              </div>
            ) : (
              renderMissionItem(item)
            ),
          )}
        </div>
      </nav>
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

      {role === 'member' ? renderMissionSidebar() : null}

      {role !== 'member' ? (
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
      ) : null}
    </aside>
  );
}
