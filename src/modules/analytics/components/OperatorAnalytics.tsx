'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { AnalyticsMetricCard } from './AnalyticsMetricCard';
import { AnalyticsPeriodToggle } from './AnalyticsPeriodToggle';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AnalyticsDashboardData, AnalyticsPeriod } from '../types';
import type { AuthUser } from '@/modules/auth/services/auth-service';

const AreaTrendChart = dynamic(() => import('./charts/AreaTrendChart').then((mod) => mod.AreaTrendChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full" />,
});

const ConversionFunnelChart = dynamic(() => import('./charts/ConversionFunnelChart').then((mod) => mod.ConversionFunnelChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] w-full" />,
});

const HorizontalBarChart = dynamic(() => import('./charts/HorizontalBarChart').then((mod) => mod.HorizontalBarChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full" />,
});

const PieDistributionChart = dynamic(() => import('./charts/PieDistributionChart').then((mod) => mod.PieDistributionChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full" />,
});

type Props = {
  user: AuthUser;
  initialPeriod: AnalyticsPeriod;
};

function normalizePeriod(value: string | null, fallback: AnalyticsPeriod): AnalyticsPeriod {
  if (value === '7d' || value === '30d' || value === '90d') return value;
  return fallback;
}

function useOperatorAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['analytics-operator', period],
    queryFn: async () => {
      const res = await fetch(`/api/v1/analytics/operator?period=${period}`);
      if (!res.ok) throw new Error('Failed to load operator analytics');
      return res.json() as Promise<{ data: AnalyticsDashboardData }>;
    },
    staleTime: 60_000,
  });
}

type RouterStatsResponse = {
  data: {
    modelDistribution: { model: string; calls: number; percentage: number; cost: number }[];
    tierDistribution: { tier: string; calls: number; percentage: number }[];
    escalationRate: number;
    costEstimate: { withRouter: number; withoutRouter: number; savings: number; savingsPercent: number };
  };
};

function useRouterStats() {
  return useQuery({
    queryKey: ['ai-router-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/router/stats');
      if (!res.ok) throw new Error('Failed to load AI router stats');
      return res.json() as Promise<RouterStatsResponse>;
    },
    staleTime: 60_000,
  });
}

export function OperatorAnalytics({ user, initialPeriod }: Props) {
  const t = useTranslations('analytics');
  const searchParams = useSearchParams();
  const period = normalizePeriod(searchParams.get('period'), initialPeriod);
  const { data, isLoading } = useOperatorAnalytics(period);
  const { data: routerStats } = useRouterStats();
  const dashboard = data?.data;
  const routerData = routerStats?.data;
  const avgResponseMinutes = dashboard?.summary.avgResponseMinutes;
  const leadTrendData = React.useMemo(() => {
    const map = new Map<string, { label: string; leads: number; conversions: number }>();
    for (const point of dashboard?.leadTrend ?? []) {
      map.set(point.label, { label: point.label, leads: Number(point.leads ?? 0), conversions: 0 });
    }
    for (const point of dashboard?.conversionTrend ?? []) {
      const current = map.get(point.label) ?? { label: point.label, leads: 0, conversions: 0 };
      current.conversions = Number(point.conversions ?? 0);
      map.set(point.label, current);
    }
    return [...map.values()];
  }, [dashboard]);

  const funnelPerformance = (dashboard?.funnelPerformance ?? []).map((item, index) => ({
    name: item.title,
    value: item.views,
    color: ['#2563eb', '#7c3aed', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'][index % 6],
  }));

  const memberStats = dashboard?.memberStats ?? [];

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('operatorTitle')}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('operatorHelp', { name: user.name })}</p>
          </div>
          <AnalyticsPeriodToggle value={period} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard label={t('totalUsers')} value={String(dashboard?.summary.totalUsers ?? 0)} loading={isLoading} />
        <AnalyticsMetricCard label={t('activeMembers')} value={String(dashboard?.summary.activeMembers ?? 0)} loading={isLoading} />
        <AnalyticsMetricCard label={t('totalLeads')} value={String(dashboard?.summary.totalLeads ?? 0)} loading={isLoading} />
        <AnalyticsMetricCard label={t('conversionRate')} value={`${dashboard?.summary.conversionRate ?? 0}%`} loading={isLoading} />
        <AnalyticsMetricCard label={t('aiUsageCount')} value={String(dashboard?.summary.aiUsageCount ?? 0)} loading={isLoading} />
        <AnalyticsMetricCard label={t('memberRetentionRate')} value={`${dashboard?.summary.memberRetentionRate ?? 0}%`} loading={isLoading} />
        <AnalyticsMetricCard
          label={t('avgResponseMinutes')}
          value={avgResponseMinutes === null || avgResponseMinutes === undefined ? '—' : `${avgResponseMinutes}m`}
          loading={isLoading}
        />
        <AnalyticsMetricCard label={t('funnelViews')} value={String(dashboard?.summary.funnelViews ?? 0)} loading={isLoading} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AreaTrendChart
          title={t('leadTrend')}
          description={t('leadTrendHelp')}
          data={leadTrendData}
          series={[
            { key: 'leads', label: t('leadsSeries'), color: '#2563eb' },
            { key: 'conversions', label: t('conversionsSeries'), color: '#10b981' },
          ]}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
        <PieDistributionChart
          title={t('stageDistribution')}
          description={t('stageDistributionHelp')}
          data={dashboard?.stageDistribution ?? []}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PieDistributionChart
          title={t('contentByPlatform')}
          description={t('contentByPlatformHelp')}
          data={dashboard?.contentByPlatform ?? []}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
        <AreaTrendChart
          title={t('actionCompletionTrend')}
          description={t('actionCompletionTrendHelp')}
          data={dashboard?.actionCompletionTrend ?? []}
          series={[
            { key: 'completed', label: t('completedSeries'), color: '#10b981' },
            { key: 'assigned', label: t('assignedSeries'), color: '#7c3aed' },
          ]}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HorizontalBarChart
          title={t('memberStats')}
          description={t('memberStatsHelp')}
          data={memberStats.map((member) => ({
            name: member.name,
            value: member.score,
            color: member.retention ? '#10b981' : '#f59e0b',
          }))}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
        <ConversionFunnelChart
          title={t('funnelPerformance')}
          description={t('funnelPerformanceHelp')}
          data={dashboard?.conversionFunnel ?? []}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">AI 路由分析</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">模型使用分布、升级率和成本节省估算。</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[var(--color-text-muted)]">升级率</p>
              <p className="text-2xl font-semibold text-[var(--color-text)]">{routerData?.escalationRate ?? 0}%</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {(routerData?.modelDistribution ?? []).slice(0, 6).map((row) => (
              <div key={row.model} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-[var(--color-text)]">{row.model}</span>
                  <span className="shrink-0 text-[var(--color-text-muted)]">
                    {row.percentage}% · {row.calls} 次 · ${row.cost.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-surface)]">
                  <div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.max(4, row.percentage)}%` }} />
                </div>
              </div>
            ))}
            {(!routerData || routerData.modelDistribution.length === 0) && (
              <p className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-muted)]">
                本月还没有 AI 路由记录。
              </p>
            )}
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--color-text)]">成本对比</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
              <span className="text-[var(--color-text-muted)]">无路由</span>
              <span className="font-semibold text-[var(--color-text)]">${routerData?.costEstimate.withoutRouter ?? 0}</span>
            </div>
            <div className="flex justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
              <span className="text-[var(--color-text-muted)]">有路由</span>
              <span className="font-semibold text-[var(--color-text)]">${routerData?.costEstimate.withRouter ?? 0}</span>
            </div>
            <div className="flex justify-between rounded-[var(--radius-md)] bg-emerald-50 px-3 py-2 text-emerald-700">
              <span>节省</span>
              <span className="font-semibold">
                ${routerData?.costEstimate.savings ?? 0} ({routerData?.costEstimate.savingsPercent ?? 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AreaTrendChart
          title={t('aiUsageTrend')}
          description={t('aiUsageTrendHelp')}
          data={dashboard?.aiUsageTrend ?? []}
          series={[
            { key: 'calls', label: t('aiCallsSeries'), color: '#7c3aed' },
            { key: 'durationMinutes', label: t('aiDurationSeries'), color: '#06b6d4' },
          ]}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
        <HorizontalBarChart
          title={t('funnelPerformance')}
          description={t('funnelPerformanceHelp')}
          data={funnelPerformance}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HorizontalBarChart
          title={t('topMembers')}
          description={t('topMembersHelp')}
          data={(dashboard?.topMembers ?? []).map((member) => ({
            name: member.name,
            value: member.score,
            color: member.retention ? '#2563eb' : '#7c3aed',
          }))}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
      </div>
    </div>
  );
}
