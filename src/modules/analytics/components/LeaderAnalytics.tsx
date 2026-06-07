'use client';

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

const HeatmapGrid = dynamic(() => import('./charts/HeatmapGrid').then((mod) => mod.HeatmapGrid), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full" />,
});

const HorizontalBarChart = dynamic(() => import('./charts/HorizontalBarChart').then((mod) => mod.HorizontalBarChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[260px] w-full" />,
});

const ConversionFunnelChart = dynamic(() => import('./charts/ConversionFunnelChart').then((mod) => mod.ConversionFunnelChart), {
  ssr: false,
  loading: () => <Skeleton className="h-[280px] w-full" />,
});

type Props = {
  user: AuthUser;
  initialPeriod: AnalyticsPeriod;
};

function normalizePeriod(value: string | null, fallback: AnalyticsPeriod): AnalyticsPeriod {
  if (value === '7d' || value === '30d' || value === '90d') return value;
  return fallback;
}

function useLeaderAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ['analytics-leader', period],
    queryFn: async () => {
      const res = await fetch(`/api/v1/analytics/leader?period=${period}`);
      if (!res.ok) throw new Error('Failed to load leader analytics');
      return res.json() as Promise<{ data: AnalyticsDashboardData }>;
    },
    staleTime: 60_000,
  });
}

export function LeaderAnalytics({ user, initialPeriod }: Props) {
  const t = useTranslations('analytics');
  const searchParams = useSearchParams();
  const period = normalizePeriod(searchParams.get('period'), initialPeriod);
  const { data, isLoading } = useLeaderAnalytics(period);
  const dashboard = data?.data;
  const avgResponseMinutes = dashboard?.summary.avgResponseMinutes;

  const topMembers = (dashboard?.topMembers ?? []).map((member) => ({
    name: member.name,
    value: member.score,
    color: member.retention ? '#10b981' : '#f59e0b',
  }));

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--color-text)]">{t('leaderTitle')}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('leaderHelp', { name: user.name })}</p>
          </div>
          <AnalyticsPeriodToggle value={period} />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard label={t('teamMembers')} value={String(dashboard?.summary.totalUsers ?? 0)} loading={isLoading} />
        <AnalyticsMetricCard label={t('activeMembers')} value={String(dashboard?.summary.activeMembers ?? 0)} loading={isLoading} />
        <AnalyticsMetricCard label={t('newMembers')} value={String(dashboard?.summary.newMembers ?? 0)} loading={isLoading} />
        <AnalyticsMetricCard label={t('memberRetentionRate')} value={`${dashboard?.summary.memberRetentionRate ?? 0}%`} loading={isLoading} />
        <AnalyticsMetricCard label={t('totalLeads')} value={String(dashboard?.summary.totalLeads ?? 0)} loading={isLoading} />
        <AnalyticsMetricCard label={t('totalConversions')} value={String(dashboard?.summary.totalConversions ?? 0)} loading={isLoading} />
        <AnalyticsMetricCard label={t('actionCompletionRate')} value={`${dashboard?.summary.actionCompletionRate ?? 0}%`} loading={isLoading} />
        <AnalyticsMetricCard
          label={t('avgResponseMinutes')}
          value={avgResponseMinutes === null || avgResponseMinutes === undefined ? '—' : `${avgResponseMinutes}m`}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AreaTrendChart
          title={t('teamGrowthTrend')}
          description={t('teamGrowthTrendHelp')}
          data={dashboard?.teamGrowthTrend ?? []}
          series={[
            { key: 'newMembers', label: t('newMembersSeries'), color: '#2563eb' },
            { key: 'leads', label: t('leadsSeries'), color: '#7c3aed' },
            { key: 'activities', label: t('activitiesSeries'), color: '#10b981' },
          ]}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
        <HeatmapGrid
          title={t('activityHeatmap')}
          description={t('activityHeatmapHelp')}
          data={dashboard?.heatmap ?? []}
          dayLabels={t.raw('weekdayLabels') as string[]}
          blockLabels={t.raw('blockLabels') as string[]}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HorizontalBarChart
          title={t('topMembers')}
          description={t('topMembersHelp')}
          data={topMembers}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
        <ConversionFunnelChart
          title={t('leadPipeline')}
          description={t('leadPipelineHelp')}
          data={dashboard?.conversionFunnel ?? []}
          loading={isLoading}
          emptyTitle={t('emptyTitle')}
          emptyDescription={t('emptyDescription')}
        />
      </div>
    </div>
  );
}
