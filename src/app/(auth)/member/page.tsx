'use client';

import * as React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, BookOpen, CheckCircle2, Mic, Play, RefreshCw, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { DailyActionList } from '@/modules/member/components/DailyActionList';
import { StreakCounter } from '@/modules/member/components/StreakCounter';
import { WeeklyDots } from '@/modules/member/components/WeeklyDots';
import { useToast } from '@/stores/toast-store';
import type { DailyActionDay, TrainingOverview, TrainingModuleOverview } from '@/modules/member/types';

type DailyActionsResponse = {
  data: DailyActionDay;
};

type DailyHistoryResponse = {
  data: {
    days: DailyActionDay[];
    streak: number;
  };
};

type TrainingResponse = {
  data: TrainingOverview;
};

function getCompletionRate(day: DailyActionDay | null) {
  if (!day || day.totalCount === 0) return 0;
  return Math.round((day.completedCount / day.totalCount) * 100);
}

function getStatusLabel(
  t: (key: string, values?: Record<string, string | number>) => string,
  module: TrainingModuleOverview,
) {
  if (module.progress?.status === 'completed') return t('trainingCompleted');
  if (module.progress?.status === 'in_progress') return t('trainingInProgress');
  return t('trainingNotStarted');
}

export default function MemberPage() {
  const t = useTranslations('member');
  const navT = useTranslations('nav');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const qc = useQueryClient();
  const view = searchParams.get('view') === 'training' ? 'training' : 'actions';
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

  const trainingQuery = useQuery({
    queryKey: ['member-training-overview'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/training');
      if (!res.ok) throw new Error('Failed to load training progress');
      return res.json() as Promise<TrainingResponse>;
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
      const day = response.data;
      if (day.allCompleted) {
        toast('success', t('allComplete'));
      } else {
        toast('success', t('actionUpdated'));
      }
    },
  });

  const trainingMutation = useMutation({
    mutationFn: async ({ moduleId, status }: { moduleId: string; status: 'in_progress' | 'completed' }) => {
      const res = await fetch('/api/v1/member/training', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, status }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to update training module');
      }
      return res.json() as Promise<{ data: unknown }>;
    },
    onSuccess: async (_, variables) => {
      await qc.invalidateQueries({ queryKey: ['member-training-overview'] });
      toast('success', variables.status === 'completed' ? t('moduleCompleted') : t('moduleStarted'));
    },
  });

  if (todayQuery.isLoading || historyQuery.isLoading || trainingQuery.isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  const today = todayQuery.data?.data ?? null;
  const history = historyQuery.data?.data.days ?? [];
  const streak = historyQuery.data?.data.streak ?? 0;
  const training = trainingQuery.data?.data ?? null;
  const week = history.slice(-7);
  const month = history.slice(-30);
  const allDone = today?.allCompleted ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            {view === 'training' ? t('trainingProgressTitle') : t('memberOverviewTitle')}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {view === 'training' ? t('trainingProgressHelp') : t('memberOverviewHelp')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={view === 'actions' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => router.push('/member')}
            icon={<Sparkles className="h-4 w-4" />}
          >
            {t('actionView')}
          </Button>
          <Button
            variant={view === 'training' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => router.push('/member?view=training')}
            icon={<BookOpen className="h-4 w-4" />}
          >
            {t('trainingView')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push('/member/voice')}
            icon={<Mic className="h-4 w-4" />}
          >
            {navT('voiceCapture')}
          </Button>
        </div>
      </div>

      {view === 'actions' ? (
        <div className="space-y-6">
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
              <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{getCompletionRate(today)}%</p>
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
              <Button
                variant="secondary"
                size="sm"
                loading={resetMutation.isPending}
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={() => resetMutation.mutate()}
              >
                {t('planReset')}
              </Button>
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('monthlyTrend')}</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('monthlyTrendHelp')}</p>
                </div>
                <Link
                  href="/member/daily-actions"
                  className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  {t('openDailyActions')}
                  <ArrowRight className="h-4 w-4" />
                </Link>
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
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
              <p className="text-sm text-[var(--color-text-muted)]">{t('trainingProgress')}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
                {training?.completedCount ?? 0}/{training?.totalCount ?? 0}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
              <p className="text-sm text-[var(--color-text-muted)]">{t('trainingCompletionRate')}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{training?.completionRate ?? 0}%</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
              <p className="text-sm text-[var(--color-text-muted)]">{t('trainingNext')}</p>
              <p className="mt-2 text-base font-semibold text-[var(--color-text)]">
                {training?.nextModule?.name ?? t('allComplete')}
              </p>
            </div>
          </section>

          <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('trainingProgressTitle')}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('trainingProgressHelp')}</p>
            </div>

            <div className="space-y-3">
              {training?.modules.map((module) => (
                <article
                  key={module.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[var(--color-text)]">{module.name}</h3>
                        <Badge
                          variant={
                            module.progress?.status === 'completed'
                              ? 'success'
                              : module.progress?.status === 'in_progress'
                                ? 'info'
                                : 'warning'
                          }
                        >
                          {getStatusLabel(t, module)}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-[var(--color-text-muted)]">{module.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {module.progress?.status !== 'completed' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<Play className="h-4 w-4" />}
                          loading={trainingMutation.isPending}
                          onClick={() => trainingMutation.mutate({ moduleId: module.id, status: 'in_progress' })}
                        >
                          {t('startModule')}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        loading={trainingMutation.isPending}
                        onClick={() => trainingMutation.mutate({ moduleId: module.id, status: 'completed' })}
                      >
                        {t('completeModule')}
                      </Button>
                    </div>
                  </div>
                  {module.progress?.completedAt && (
                    <p className="mt-3 text-xs text-[var(--color-text-muted)]">
                      {t('completedAt')} {new Date(module.progress.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
