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

function useMemberAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['analytics-member', period],
    queryFn: async () => {
      const res = await fetch(`/api/v1/analytics/member?period=${period}`);
      if (!res.ok) throw new Error('Failed to load member analytics');
      return res.json() as Promise<{ data: AnalyticsDashboardData }>;
    },
    staleTime: 60_000,
  });
}

export function MemberAnalytics({ user, initialPeriod }: Props) {
  const t = useTranslations('analytics');
  const searchParams = useSearchParams();
  const period = normalizePeriod(searchParams.get('period'), initialPeriod);
  const { data, isLoading } = useMemberAnalytics(period);
  const dashboard = data?.data;
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

  const metricCards = [
    { label: t('totalLeads'), value: String(dashboard?.summary.totalLeads ?? 0) },
    { label: t('totalConversions'), value: String(dashboard?.summary.totalConversions ?? 0) },
    { label: t('conversionRate'), value: `${dashboard?.summary.conversionRate ?? 0}%` },
    { label: t('contentCount'), value: String(dashboard?.summary.contentCount ?? 0) },
    { label: t('aiUsageCount'), value: String(dashboard?.summary.aiUsageCount ?? 0) },
    { label: t('actionCompletionRate'), value: `${dashboard?.summary.actionCompletionRate ?? 0}%` },
    { label: t('funnelViews'), value: String(dashboard?.summary.funnelViews ?? 0) },
    { label: t('funnelConversions'), value: String(dashboard?.summary.funnelConversions ?? 0) },
  ];

  const funnelPerformance = (dashboard?.funnelPerformance ?? []).map((item, index) => ({
    name: item.title,
    value: item.conversionRate,
    color: ['#2563eb', '#7c3aed', '#f59e0b', '#10b981', '#06b6d4', '#ef4444'][index % 6],
  }));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('title')}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('memberHelp', { name: user.name })}</p>
          </div>
          <AnalyticsPeriodToggle value={period} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <AnalyticsMetricCard key={card.label} label={card.label} value={card.value} loading={isLoading} />
        ))}
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
        <ConversionFunnelChart
          title={t('conversionFunnel')}
          description={t('conversionFunnelHelp')}
          data={dashboard?.conversionFunnel ?? []}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <PieDistributionChart
          title={t('stageDistribution')}
          description={t('stageDistributionHelp')}
          data={dashboard?.stageDistribution ?? []}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
        <PieDistributionChart
          title={t('contentByPlatform')}
          description={t('contentByPlatformHelp')}
          data={dashboard?.contentByPlatform ?? []}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
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
    </div>
  );
}
