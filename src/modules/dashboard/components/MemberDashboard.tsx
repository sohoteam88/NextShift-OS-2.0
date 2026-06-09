'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { AICoachCard } from './AICoachCard';
import { BrandBuilderWidget } from './BrandBuilderWidget';
import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = { userName?: string };

type DailyProgress = {
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
  hasData: boolean;
};

type CrmStats = {
  total_leads: number;
  followup_overdue: number;
  followup_today: number;
  leads_this_week: number;
};

// ─── Data hooks ───────────────────────────────────────────────────────────────

function useDailyActions() {
  return useQuery({
    queryKey: ['daily-actions-today'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/daily-actions');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ data: DailyProgress }>;
    },
    staleTime: 60_000,
  });
}

function useCrmStats() {
  return useQuery({
    queryKey: ['crm-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/crm/stats');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ data: CrmStats }>;
    },
    staleTime: 60_000,
  });
}

// ─── 1. Mission Control Banner ────────────────────────────────────────────────

function MissionControlBanner({
  daily,
  stats,
  userName,
}: {
  daily: DailyProgress | undefined;
  stats: CrmStats | undefined;
  userName: string;
}) {
  const overdue = stats?.followup_overdue ?? 0;
  const remaining = (daily?.totalCount ?? 0) - (daily?.completedCount ?? 0);
  const allDone = daily?.allCompleted ?? false;

  const h = new Date().getHours();
  const greeting = h < 12 ? '早安' : h < 18 ? '下午好' : '晚上好';

  let action: string;
  let sub: string;
  let estimatedMin: number;
  let href: string;

  if (overdue > 0) {
    action = `处理 ${overdue} 个逾期客户跟进`;
    sub = '这些客户正在等待你的回应';
    estimatedMin = Math.max(5, overdue * 3);
    href = '/crm';
  } else if (daily?.hasData && remaining > 0) {
    action = `完成今日 ${remaining} 个待办行动`;
    sub = '保持执行节奏，距离目标更近一步';
    estimatedMin = remaining * 5;
    href = '/member';
  } else if (allDone) {
    action = '今日任务全部完成，继续添加新客户';
    sub = '很棒！保持每日执行的好习惯';
    estimatedMin = 10;
    href = '/crm';
  } else {
    action = '完成今日内容发布与客户跟进';
    sub = '每天一点，建立稳定的引流系统';
    estimatedMin = 18;
    href = '/member';
  }

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-md">
      <div className="relative z-10">
        <p className="text-sm font-medium text-blue-200">
          {greeting}，{userName} · 🎯 今天最重要的一步
        </p>
        <p className="mt-1.5 text-xl font-bold leading-snug">{action}</p>
        <p className="mt-0.5 text-sm text-blue-200">{sub}</p>
        <p className="mt-1.5 text-xs text-blue-300">⏱ 预计时间：{estimatedMin} 分钟</p>
        <Link
          href={href}
          className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition-colors hover:bg-blue-50"
        >
          立即开始 <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-6 right-4 h-20 w-20 rounded-full bg-white/5" />
    </div>
  );
}

// ─── 2. Quick Actions Row ─────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: '生成FB贴文', emoji: '📝', href: '/ai' },
  { label: '生成Reel脚本', emoji: '🎬', href: '/ai' },
  { label: '短视频Prompt', emoji: '📱', href: '/ai' },
  { label: '生成Landing Page', emoji: '🌐', href: '/ai/funnel-builder' },
  { label: '跟进客户', emoji: '📞', href: '/crm' },
];

function QuickActionsRow() {
  return (
    <div>
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        快捷行动
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={action.href}
            className="flex shrink-0 flex-col items-center gap-1.5 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white px-4 py-3 text-center shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--color-primary)] hover:bg-blue-50"
          >
            <span className="text-xl leading-none">{action.emoji}</span>
            <span className="whitespace-nowrap text-xs font-medium text-[var(--color-text)]">
              {action.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── 3. Metrics Grid ──────────────────────────────────────────────────────────

type MetricItem = {
  label: string;
  value: number | string;
  sub: string;
  href: string;
  accent: string;
  loading: boolean;
  urgent?: boolean;
  disabled?: boolean;
};

function MetricCard({ m }: { m: MetricItem }) {
  const inner = (
    <>
      <p className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">{m.label}</p>
      {m.loading ? (
        <Skeleton className="mb-1 h-7 w-14" />
      ) : (
        <p className={cn('text-2xl font-bold', m.accent)}>{m.value}</p>
      )}
      <p className="mt-0.5 text-[10px] text-[var(--color-text-muted)]">{m.sub}</p>
    </>
  );

  const baseClass = 'rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)]';

  if (m.disabled) {
    return (
      <div className={cn(baseClass, 'border-[var(--color-border)] bg-[var(--color-surface)] opacity-60')}>
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={m.href}
      className={cn(
        baseClass,
        'transition-colors',
        m.urgent
          ? 'border-red-200 bg-red-50 hover:border-red-400'
          : 'border-[var(--color-border)] bg-white hover:border-[var(--color-primary)] hover:bg-blue-50',
      )}
    >
      {inner}
    </Link>
  );
}

function MetricsGrid({
  daily,
  stats,
  isLoadingDaily,
  isLoadingStats,
}: {
  daily: DailyProgress | undefined;
  stats: CrmStats | undefined;
  isLoadingDaily: boolean;
  isLoadingStats: boolean;
}) {
  const completedCount = daily?.completedCount ?? 0;
  const totalCount = daily?.totalCount ?? 0;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const overdue = stats?.followup_overdue ?? 0;

  const metrics: MetricItem[] = [
    {
      label: '今日行动进度',
      value: `${completedCount}/${totalCount}`,
      sub: totalCount > 0 ? `完成率 ${pct}%` : '暂无行动计划',
      href: '/member',
      accent: pct === 100 ? 'text-green-600' : 'text-[var(--color-primary)]',
      loading: isLoadingDaily,
    },
    {
      label: '潜在客户',
      value: stats?.total_leads ?? 0,
      sub: (stats?.leads_this_week ?? 0) > 0 ? `+${stats!.leads_this_week} 本周新增` : '继续引流',
      href: '/crm',
      accent: 'text-[var(--color-text)]',
      loading: isLoadingStats,
    },
    {
      label: '本周对话',
      value: stats?.leads_this_week ?? 0,
      sub: '新增潜在客户',
      href: '/crm',
      accent: 'text-[var(--color-text)]',
      loading: isLoadingStats,
    },
    {
      label: '待跟进',
      value: (stats?.followup_overdue ?? 0) + (stats?.followup_today ?? 0),
      sub: overdue > 0 ? `${overdue} 个已逾期` : '保持跟进节奏',
      href: '/crm',
      accent: overdue > 0 ? 'text-red-600' : 'text-[var(--color-text)]',
      urgent: overdue > 0,
      loading: isLoadingStats,
    },
    {
      // TODO: add consultation booking module
      label: '预约咨询',
      value: 0,
      sub: '功能即将推出',
      href: '#',
      accent: 'text-[var(--color-text-muted)]',
      loading: false,
      disabled: true,
    },
    {
      // TODO: add conversion tracking to CRM stats
      label: '成交客户',
      value: 0,
      sub: '功能即将推出',
      href: '#',
      accent: 'text-[var(--color-text-muted)]',
      loading: false,
      disabled: true,
    },
  ];

  return (
    <div>
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
        业务概览
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {metrics.map((m) => (
          <MetricCard key={m.label} m={m} />
        ))}
      </div>
    </div>
  );
}

// ─── 5. Level Progress Card ───────────────────────────────────────────────────

const LEVELS = [
  { level: 1, title: '启动系统', desc: '完成账号注册与基本设置' },
  { level: 2, title: '完成个人定位', desc: '确定你的目标市场与卖点' },
  { level: 3, title: '发布第一批内容', desc: '发布 3 篇以上的内容' },
  { level: 4, title: '获得第一个潜在客户', desc: '至少 1 位客户主动联系你' },
  { level: 5, title: '完成第一次跟进', desc: '与客户进行一对一对话' },
  { level: 6, title: '获得第一笔收入', desc: '成功成交第一位付费客户' },
  { level: 7, title: '开始复制团队', desc: '建立团队或转介绍体系' },
];

function LevelProgressCard({
  daily,
  stats,
}: {
  daily: DailyProgress | undefined;
  stats: CrmStats | undefined;
}) {
  const totalLeads = stats?.total_leads ?? 0;
  const completedCount = daily?.completedCount ?? 0;
  const followupToday = stats?.followup_today ?? 0;

  let currentLevel = 1;
  if (completedCount > 0) currentLevel = 2;
  if (completedCount > 2) currentLevel = 3;
  if (totalLeads > 0) currentLevel = 4;
  if (totalLeads > 0 && followupToday > 0) currentLevel = 5;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">🚀 成功路线图</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            当前：Level {currentLevel} · {LEVELS[currentLevel - 1].title}
          </p>
        </div>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
          Lv.{currentLevel}
        </span>
      </div>

      <div className="space-y-1">
        {LEVELS.map(({ level, title }) => {
          const done = level < currentLevel;
          const active = level === currentLevel;

          return (
            <div
              key={level}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2',
                active ? 'bg-blue-50' : 'hover:bg-[var(--color-surface)]',
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  done
                    ? 'bg-green-500 text-white'
                    : active
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]',
                )}
              >
                {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : level}
              </div>
              <span
                className={cn(
                  'flex-1 text-sm',
                  done
                    ? 'text-[var(--color-text-muted)] line-through'
                    : active
                      ? 'font-semibold text-[var(--color-text)]'
                      : 'text-[var(--color-text-muted)]',
                )}
              >
                {title}
              </span>
              {active && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                  进行中
                </span>
              )}
              {!done && !active && level === currentLevel + 1 && (
                <span className="text-[10px] text-[var(--color-text-muted)]">下一关</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function MemberDashboard({ userName = 'User' }: Props) {
  const { data: dailyData, isLoading: isLoadingDaily } = useDailyActions();
  const { data: statsData, isLoading: isLoadingStats } = useCrmStats();

  const daily = dailyData?.data;
  const stats = statsData?.data;

  return (
    <div className="space-y-6">
      {/* 1. Mission Control */}
      <MissionControlBanner daily={daily} stats={stats} userName={userName} />

      {/* 2. Quick Actions */}
      <QuickActionsRow />

      {/* 3. Metrics Grid */}
      <MetricsGrid
        daily={daily}
        stats={stats}
        isLoadingDaily={isLoadingDaily}
        isLoadingStats={isLoadingStats}
      />

      {/* 4. AI Coach */}
      <AICoachCard userName={userName} />

      {/* 5. Brand Builder */}
      <BrandBuilderWidget />

      {/* 6. Level Progress */}
      <LevelProgressCard daily={daily} stats={stats} />
    </div>
  );
}
