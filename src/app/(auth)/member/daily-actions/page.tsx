'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { DailyActionList } from '@/modules/member/components/DailyActionList';
import { StreakCounter } from '@/modules/member/components/StreakCounter';
import { WeeklyDots } from '@/modules/member/components/WeeklyDots';
import { useToast } from '@/stores/toast-store';
import type { DailyActionDay } from '@/modules/member/types';

type DailyActionsResponse = {
  data: DailyActionDay;
};

type DailyHistoryResponse = {
  data: {
    days: DailyActionDay[];
    streak: number;
  };
};

export default function MemberDailyActionsPage() {
  const t = useTranslations('member');
  const qc = useQueryClient();
  const { toast } = useToast();
  const [activeToggleIndex, setActiveToggleIndex] = React.useState<number | null>(null);

  const todayQuery = useQuery({
    queryKey: ['member-daily-actions-today'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/daily-actions');
      if (!res.ok) throw new Error('Failed to load daily actions');
      return res.json() as Promise<DailyActionsResponse>;
    },
  });

  const historyQuery = useQuery({
    queryKey: ['member-daily-actions-history'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/daily-actions/history');
      if (!res.ok) throw new Error('Failed to load daily action history');
      return res.json() as Promise<DailyHistoryResponse>;
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/member/daily-actions', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to reset daily plan');
      return res.json() as Promise<DailyActionsResponse>;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['member-daily-actions-today'] });
      await qc.invalidateQueries({ queryKey: ['member-daily-actions-history'] });
      toast('success', t('planReset'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (index: number) => {
      const res = await fetch('/api/v1/member/daily-actions/toggle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to update action');
      }
      return res.json() as Promise<DailyActionsResponse>;
    },
    onSuccess: async (response) => {
      await qc.invalidateQueries({ queryKey: ['member-daily-actions-today'] });
      await qc.invalidateQueries({ queryKey: ['member-daily-actions-history'] });
      toast('success', response.data.allCompleted ? t('allComplete') : t('actionUpdated'));
    },
  });

  if (todayQuery.isLoading || historyQuery.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const today = todayQuery.data?.data ?? null;
  const history = historyQuery.data?.data.days ?? [];
  const streak = historyQuery.data?.data.streak ?? 0;
  const week = history.slice(-7);
  const month = history.slice(-30);
  const allDone = today?.allCompleted ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">{t('dailyActionsTitle')}</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{t('today')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('dailyActionsHelp')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/member"
            className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
          >
            {t('backToMember')}
          </Link>
          <Button
            variant="secondary"
            loading={resetMutation.isPending}
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => resetMutation.mutate()}
          >
            {t('planReset')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
          <StreakCounter streak={streak} />
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
          <p className="text-sm text-[var(--color-text-muted)]">{t('todayProgress')}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
            {today?.completedCount ?? 0}/{today?.totalCount ?? 0}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
          <p className="text-sm text-[var(--color-text-muted)]">{t('todayCompletionRate')}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
            {today && today.totalCount > 0 ? Math.round((today.completedCount / today.totalCount) * 100) : 0}%
          </p>
        </div>
      </div>

      {allDone && (
        <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {t('allComplete')}
        </div>
      )}

      <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('dailyActionsTitle')}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('dailyActionsHelp')}</p>
          </div>
          <Link href="/member?view=training" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline">
            {t('trainingView')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {today ? (
          <DailyActionList
            actions={today.actions}
            loadingIndex={activeToggleIndex}
            onToggle={(index) => {
              setActiveToggleIndex(index);
              toggleMutation.mutate(index, { onSettled: () => setActiveToggleIndex(null) });
            }}
          />
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <WeeklyDots days={week} />
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('monthlyTrend')}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('monthlyTrendHelp')}</p>
          </div>
          <div className="mt-4 flex items-end gap-1 overflow-x-auto pb-1">
            {month.map((day) => {
              const ratio = day.totalCount > 0 ? day.completedCount / day.totalCount : 0;
              const height = Math.max(8, Math.round(12 + ratio * 60));
              return (
                <div key={day.date} className="flex flex-none flex-col items-center gap-1">
                  <div
                    className="w-2 rounded-t-[4px] rounded-b-[2px] bg-[var(--color-primary)] transition-opacity"
                    style={{ height }}
                    title={`${day.date} ${day.completedCount}/${day.totalCount}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
