'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/Skeleton';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { FollowupWidget } from '@/modules/crm/components/FollowupWidget';
import { RecentActivities } from '@/modules/crm/components/RecentActivities';
import { StageDistributionChart } from '@/modules/crm/components/StageDistributionChart';

type CrmStats = {
  total_leads: number;
  leads_by_stage: { stage: string; count: number }[];
  leads_by_score: { hot: number; warm: number; cold: number };
  conversion_rate: number;
  followup_overdue: number;
  followup_today: number;
  leads_this_week: number;
  activities_this_week: number;
};

type FunnelAnalytics = { total_views: number; total_submissions: number; published_funnels: number };

function useFunnelStats() {
  return useQuery({
    queryKey: ['funnel-analytics-summary'],
    queryFn: async () => {
      const res = await fetch('/api/v1/funnel/analytics');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ data: FunnelAnalytics }>;
    },
    staleTime: 60_000,
  });
}

function useStats() {
  return useQuery({
    queryKey: ['crm-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/crm/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json() as Promise<{ data: CrmStats }>;
    },
    staleTime: 60_000,
  });
}

function KpiCard({
  label,
  value,
  urgent,
  loading,
  tooltip,
}: {
  label: string;
  value: string;
  urgent?: boolean;
  loading?: boolean;
  tooltip?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] border bg-white p-4 shadow-[var(--shadow-sm)] ${
        urgent ? 'border-red-200 bg-red-50' : 'border-[var(--color-border)]'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
        {tooltip && <HelpTooltip text={tooltip} />}
      </div>
      {loading ? (
        <Skeleton className="mt-1 h-8 w-16" />
      ) : (
        <p className={`mt-1 text-2xl font-semibold ${urgent ? 'text-red-600' : 'text-[var(--color-text)]'}`}>
          {value}
        </p>
      )}
    </div>
  );
}

export function MemberDashboard() {
  const t = useTranslations('dashboard');
  const { data: statsData, isLoading } = useStats();
  const { data: funnelStatsData } = useFunnelStats();
  const stats = statsData?.data;

  const followupPending = (stats?.followup_overdue ?? 0) + (stats?.followup_today ?? 0);
  const isOverdue = (stats?.followup_overdue ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          {t('welcome', { name: 'User' })}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('todayMission')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label={t('myLeads')}
          value={isLoading ? '—' : String(stats?.total_leads ?? 0)}
          loading={isLoading}
        />
        <KpiCard
          label={t('conversionRate')}
          value={isLoading ? '—' : `${stats?.conversion_rate ?? 0}%`}
          tooltip={t('conversionRateHelp')}
          loading={isLoading}
        />
        <KpiCard
          label={t('followUp')}
          value={isLoading ? '—' : String(followupPending)}
          urgent={isOverdue}
          loading={isLoading}
        />
        <KpiCard
          label="漏斗浏览"
          value={String(funnelStatsData?.data.total_views ?? '—')}
          loading={isLoading}
        />
      </div>

      <FollowupWidget />

      <StageDistributionChart
        data={stats?.leads_by_stage ?? []}
        loading={isLoading}
      />

      <RecentActivities />
    </div>
  );
}
