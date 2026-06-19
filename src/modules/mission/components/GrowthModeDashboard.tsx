'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, CalendarDays, FileText, GitBranch, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

type CalendarItem = {
  id: string;
  title: string;
  platform: string;
  format: string;
};

type CrmStats = {
  followup_overdue: number;
  followup_today: number;
  leads_by_score?: {
    hot: number;
  };
  conversion_rate: number;
};

function useTodayContent() {
  return useQuery({
    queryKey: ['brand-builder', 'calendar', 'today'],
    queryFn: async () => {
      const res = await fetch('/api/v1/brand-builder/calendar/today');
      if (!res.ok) throw new Error('Failed to fetch today content');
      return res.json() as Promise<{ data: CalendarItem[] }>;
    },
    staleTime: 60_000,
  });
}

function useCrmStats() {
  return useQuery({
    queryKey: ['crm-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/crm/stats');
      if (!res.ok) throw new Error('Failed to fetch CRM stats');
      return res.json() as Promise<{ data: CrmStats }>;
    },
    staleTime: 60_000,
  });
}

const QUICK_LINKS = [
  { label: 'AI Tools', href: '/content-engine', icon: Sparkles },
  { label: 'Content Calendar', href: '/brand-builder/calendar', icon: CalendarDays },
  { label: 'CRM Pipeline', href: '/crm/pipeline', icon: GitBranch },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function GrowthModeDashboard() {
  const todayContent = useTodayContent();
  const crmStats = useCrmStats();
  const item = todayContent.data?.data?.[0];
  const stats = crmStats.data?.data;
  const hotLeads = stats?.leads_by_score?.hot ?? 0;
  const followups = (stats?.followup_overdue ?? 0) + (stats?.followup_today ?? 0);

  return (
    <div className="space-y-5">
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-rose-600">增长模式</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">今天继续扩大你的系统</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          核心旅程已经完成。现在重点是更多内容、更多流量、更多跟进。
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <h3 className="text-base font-semibold text-[var(--color-text)]">今天的内容任务</h3>
          </div>
          {todayContent.isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : item ? (
            <>
              <p className="text-lg font-semibold text-[var(--color-text)]">{item.title}</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {item.platform} · {item.format}
              </p>
              <Link
                href="/content-engine"
                className="mt-4 inline-flex h-10 items-center rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                生成文案 →
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm text-[var(--color-text-muted)]">今天还没有内容安排。</p>
              <Link
                href="/ai/content-plan"
                className="mt-4 inline-flex h-10 items-center rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
              >
                规划内容 →
              </Link>
            </>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-[var(--color-text)]">需要关注</h3>
          {crmStats.isLoading ? (
            <div className="mt-4 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <Link
                href="/crm"
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 hover:bg-[var(--color-surface)]"
              >
                <span className="text-sm font-medium text-[var(--color-text)]">🔥 Hot Lead 待跟进</span>
                <span className="text-sm font-semibold text-blue-600">{hotLeads}</span>
              </Link>
              <Link
                href="/crm"
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 hover:bg-[var(--color-surface)]"
              >
                <span className="text-sm font-medium text-[var(--color-text)]">跟进行动</span>
                <span className="text-sm font-semibold text-blue-600">{followups}</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {QUICK_LINKS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:border-blue-300 hover:bg-blue-50"
          >
            <span className="text-sm font-semibold text-[var(--color-text)]">{label}</span>
            <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
          </Link>
        ))}
      </section>
    </div>
  );
}
