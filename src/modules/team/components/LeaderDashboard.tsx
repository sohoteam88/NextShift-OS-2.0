'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { LeaderDashboardData } from '../types';
import { TeamAlerts } from './TeamAlerts';
import { TopPerformers } from './TopPerformers';

const TeamPerformanceTable = dynamic(() => import('./TeamPerformanceTable').then((mod) => mod.TeamPerformanceTable), {
  ssr: false,
  loading: () => <Skeleton className="h-72 w-full rounded-[var(--radius-lg)]" />,
});

const WeeklyTrendChart = dynamic(() => import('./WeeklyTrendChart').then((mod) => mod.WeeklyTrendChart), {
  ssr: false,
  loading: () => <Skeleton className="h-80 w-full rounded-[var(--radius-lg)]" />,
});

type Props = {
  user: AuthUser;
};

function useLeaderDashboard() {
  return useQuery({
    queryKey: ['team-dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/v1/team/dashboard');
      if (!res.ok) throw new Error('Failed to load dashboard');
      return res.json() as Promise<{ data: LeaderDashboardData }>;
    },
    staleTime: 60_000,
  });
}

function SummaryCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      {loading ? <Skeleton className="mt-2 h-8 w-20" /> : <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{value}</p>}
    </div>
  );
}

export function LeaderDashboard({ user }: Props) {
  const t = useTranslations('dashboard');
  const { data, isLoading } = useLeaderDashboard();
  const dashboard = data?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          {t('teamDashboardTitle', { name: user.name })}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('teamDashboardHelp')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <SummaryCard label={t('teamMembersCount')} value={String(dashboard?.summary.totalMembers ?? 0)} loading={isLoading} />
        <SummaryCard label={t('activeMembersCount')} value={String(dashboard?.summary.activeMembers ?? 0)} loading={isLoading} />
        <SummaryCard label={t('totalLeadsCount')} value={String(dashboard?.summary.totalLeads ?? 0)} loading={isLoading} />
        <SummaryCard label={t('teamConversionRateLabel')} value={`${dashboard?.summary.teamConversionRate ?? 0}%`} loading={isLoading} />
        <SummaryCard label={t('pendingApprovalsLabel')} value={String(dashboard?.summary.pendingApprovals ?? 0)} loading={isLoading} />
        <SummaryCard label={t('totalConversionsCount')} value={String(dashboard?.summary.totalConversions ?? 0)} loading={isLoading} />
      </div>

      {dashboard?.alerts ? <TeamAlerts alerts={dashboard.alerts} /> : <Skeleton className="h-40 w-full rounded-[var(--radius-lg)]" />}

      {dashboard?.topPerformers ? (
        <TopPerformers members={dashboard.memberPerformance} initialTopPerformers={dashboard.topPerformers} />
      ) : (
        <Skeleton className="h-56 w-full rounded-[var(--radius-lg)]" />
      )}

      {dashboard?.memberPerformance ? (
        <TeamPerformanceTable members={dashboard.memberPerformance} />
      ) : (
        <Skeleton className="h-72 w-full rounded-[var(--radius-lg)]" />
      )}

      {dashboard?.weeklyTrend ? (
        <WeeklyTrendChart weeklyTrend={dashboard.weeklyTrend} />
      ) : (
        <Skeleton className="h-80 w-full rounded-[var(--radius-lg)]" />
      )}
    </div>
  );
}
