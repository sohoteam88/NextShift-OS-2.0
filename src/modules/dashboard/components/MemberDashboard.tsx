'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, AlertCircle, Users, Flame } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { AICoachCard } from './AICoachCard';

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = { userName?: string };

// ─── Data hooks ───────────────────────────────────────────────────────────────

type DailyProgress = { completedCount: number; totalCount: number; allCompleted: boolean; hasData: boolean };

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

type CrmStats = { total_leads: number; followup_overdue: number; followup_today: number; leads_this_week: number };

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

// ─── Greeting helpers ─────────────────────────────────────────────────────────

function useGreeting(name: string) {
  const [greeting, setGreeting] = React.useState('');
  const [dateStr, setDateStr] = React.useState('');

  React.useEffect(() => {
    const h = new Date().getHours();
    const emoji = h < 12 ? '☀️' : h < 18 ? '⛅' : '🌙';
    const prefix = h < 12 ? '早安' : h < 18 ? '下午好' : '晚上好';
    setGreeting(`${prefix}，${name} ${emoji}`);

    const now = new Date();
    setDateStr(now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }));
  }, [name]);

  return { greeting, dateStr };
}

// ─── Card 1: Greeting ─────────────────────────────────────────────────────────

function GreetingCard({ userName }: { userName: string }) {
  const { greeting, dateStr } = useGreeting(userName);
  const motivations = [
    '新的一天，继续创造成果！',
    '每一次跟进都是机会。',
    '专注行动，结果自来。',
    '今天的努力是明天的收入。',
  ];
  const motivation = React.useMemo(() => motivations[Math.floor(Math.random() * motivations.length)], []);

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          {greeting || `你好，${userName}`}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{motivation}</p>
      </div>
      {dateStr && (
        <span className="shrink-0 rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
          {dateStr}
        </span>
      )}
    </div>
  );
}

// ─── Card 2: Today's Mission ──────────────────────────────────────────────────

function MissionCard() {
  const { data, isLoading } = useDailyActions();
  const progress = data?.data;

  const pct = progress && progress.totalCount > 0
    ? Math.round((progress.completedCount / progress.totalCount) * 100)
    : 0;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium text-[var(--color-text)]">今日任务</span>
        </div>
        {progress?.allCompleted && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3 w-3" /> 全部完成
          </span>
        )}
      </div>

      {isLoading ? (
        <>
          <Skeleton className="mb-3 h-5 w-32" />
          <Skeleton className="h-2 w-full rounded-full" />
        </>
      ) : !progress?.hasData ? (
        <div>
          <p className="mb-3 text-sm text-[var(--color-text-muted)]">还没有今日行动计划</p>
          <Link
            href="/member"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            制定今日计划 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div>
          <div className="mb-2 flex items-end justify-between">
            <p className="text-sm text-[var(--color-text-muted)]">
              已完成 <span className="text-lg font-semibold text-[var(--color-text)]">{progress.completedCount}</span>
              {' '}/ {progress.totalCount} 个行动
            </p>
            <span className="text-sm font-medium text-[var(--color-primary)]">{pct}%</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface)]">
            <div
              className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {!progress.allCompleted && (
            <Link
              href="/member"
              className="mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              继续完成 <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Card 3: Leads Snapshot ───────────────────────────────────────────────────

function LeadsCard() {
  const { data, isLoading } = useCrmStats();
  const stats = data?.data;
  const overdue = stats?.followup_overdue ?? 0;
  const followupToday = stats?.followup_today ?? 0;
  const urgent = overdue > 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Total leads */}
      <Link
        href="/crm"
        className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--color-primary)] hover:bg-blue-50"
      >
        <div className="mb-2 flex items-center gap-2">
          <Users className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-xs font-medium text-[var(--color-text-muted)]">潜在客户</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <>
            <p className="text-2xl font-semibold text-[var(--color-text)]">{stats?.total_leads ?? 0}</p>
            {(stats?.leads_this_week ?? 0) > 0 && (
              <p className="mt-0.5 text-xs text-green-600">+{stats!.leads_this_week} 本周新增</p>
            )}
          </>
        )}
      </Link>

      {/* Follow-up urgent */}
      <Link
        href="/crm"
        className={`rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)] transition-colors ${
          urgent
            ? 'border-red-200 bg-red-50 hover:border-red-400'
            : 'border-[var(--color-border)] bg-white hover:border-[var(--color-primary)] hover:bg-blue-50'
        }`}
      >
        <div className="mb-2 flex items-center gap-2">
          <AlertCircle className={`h-4 w-4 ${urgent ? 'text-red-500' : 'text-[var(--color-text-muted)]'}`} />
          <span className={`text-xs font-medium ${urgent ? 'text-red-700' : 'text-[var(--color-text-muted)]'}`}>
            待跟进
          </span>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <>
            <p className={`text-2xl font-semibold ${urgent ? 'text-red-600' : 'text-[var(--color-text)]'}`}>
              {overdue + followupToday}
            </p>
            {urgent && (
              <p className="mt-0.5 text-xs text-red-600">{overdue} 个已逾期</p>
            )}
          </>
        )}
      </Link>
    </div>
  );
}

// ─── Card 5: Continue CTA ────────────────────────────────────────────────────

function ContinueCard() {
  const { data: dailyData } = useDailyActions();
  const { data: statsData } = useCrmStats();

  const overdue = statsData?.data.followup_overdue ?? 0;
  const allDone = dailyData?.data.allCompleted ?? false;
  const hasActions = dailyData?.data.hasData ?? false;

  let href = '/crm';
  let label = '查看潜在客户';
  let sub = '管理你的销售管道';

  if (overdue > 0) {
    href = '/crm';
    label = `处理 ${overdue} 个逾期跟进`;
    sub = '这些客户等待你的回应';
  } else if (hasActions && !allDone) {
    href = '/member';
    label = '完成今日行动';
    sub = '保持每日执行节奏';
  }

  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)] transition-colors hover:border-[var(--color-primary)] hover:bg-blue-50"
    >
      <div>
        <p className="font-medium text-[var(--color-text)]">{label}</p>
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{sub}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-[var(--color-primary)]" />
    </Link>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function MemberDashboard({ userName = 'User' }: Props) {
  return (
    <div className="space-y-4">
      {/* Card 1: Greeting */}
      <GreetingCard userName={userName} />

      {/* Card 2: Today's Mission */}
      <MissionCard />

      {/* Card 3: Leads Snapshot */}
      <LeadsCard />

      {/* Card 4: AI Coach */}
      <AICoachCard userName={userName} />

      {/* Card 5: Continue CTA */}
      <ContinueCard />
    </div>
  );
}
