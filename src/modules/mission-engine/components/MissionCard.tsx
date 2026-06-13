'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { MissionStage, MissionStageId } from '../missionStages';
import { ALL_STAGES } from '../missionStages';
import type { UserMode, CurrentMission, CompleteMissionResult } from '../missionEngineService';

// ============================================================
// Hooks
// ============================================================

async function readJson<T>(res: Response, message: string): Promise<T> {
  if (!res.ok) throw new Error(message);
  return res.json() as Promise<T>;
}

export function useMissionCurrent(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['mission-engine', 'current'],
    queryFn: async () => {
      const res = await fetch('/api/mission/current');
      return readJson<{
        data: {
          currentMission: CurrentMission;
          progress: {
            currentStageId: string | null;
            nextStageId: string | null;
            progressPercent: number;
            totalXP: number;
            completedChecks: string[];
            totalStages: number;
            completedStages: number;
            mode: UserMode;
            isJourneyComplete: boolean;
          };
          achievements: Array<{
            id: string;
            key: string;
            title: string;
            description: string;
            icon: string;
            xpAwarded: number;
            unlockedAt: string;
          }>;
        };
      }>(res, 'Failed to fetch mission');
    },
    staleTime: 10_000,
    enabled: options?.enabled ?? true,
  });
}

export function useCompleteMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stageId: MissionStageId) => {
      const res = await fetch('/api/mission/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId }),
      });
      return readJson<{ data: CompleteMissionResult }>(res, 'Failed to complete mission');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-engine'] });
      queryClient.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}

export function useSwitchMissionMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mode: UserMode) => {
      const res = await fetch('/api/mission/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      return readJson<{ data: { mode: UserMode; message: string } }>(res, 'Failed to switch mode');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mission-engine'] });
      queryClient.invalidateQueries({ queryKey: ['mission'] });
    },
  });
}

// ============================================================
// Component
// ============================================================

type Locale = 'zh' | 'en' | 'ms';

interface MissionCardProps {
  locale?: Locale;
  className?: string;
}

const TEXT: Record<Locale, {
  coachGreeting: string;
  coachTagline: string;
  yourNextMove: string;
  whyThisMatters: string;
  estimatedTime: string;
  completeButton: string;
  completing: string;
  journeyComplete: string;
  journeyCompleteDesc: string;
  beginner: string;
  advanced: string;
  modeHint: string;
  progressLabel: string;
  xpLabel: string;
  stageLabel: string;
  congratsToast: string;
}> = {
  zh: {
    coachGreeting: '你的下一步',
    coachTagline: 'AI Coach 为你规划了最高效的成长路径',
    yourNextMove: '现在该做什么',
    whyThisMatters: '为什么这一步重要',
    estimatedTime: '预计用时',
    completeButton: '标记完成',
    completing: '完成中...',
    journeyComplete: '核心系统已完成！',
    journeyCompleteDesc: '你已经掌握了从品牌到成交的完整路径。现在进入增长模式，扩大你的影响力。',
    beginner: '新手',
    advanced: '高级',
    modeHint: '模式',
    progressLabel: '总体进度',
    xpLabel: '经验值',
    stageLabel: '阶段',
    congratsToast: '成就解锁！',
  },
  en: {
    coachGreeting: 'Your Next Move',
    coachTagline: 'AI Coach has mapped the most efficient growth path for you',
    yourNextMove: 'What to do next',
    whyThisMatters: 'Why this matters',
    estimatedTime: 'Estimated time',
    completeButton: 'Mark Complete',
    completing: 'Completing...',
    journeyComplete: 'Core System Complete!',
    journeyCompleteDesc: 'You have mastered the full path from brand to sale. Now scale your impact.',
    beginner: 'Beginner',
    advanced: 'Advanced',
    modeHint: 'Mode',
    progressLabel: 'Overall Progress',
    xpLabel: 'XP',
    stageLabel: 'Stage',
    congratsToast: 'Achievement unlocked!',
  },
  ms: {
    coachGreeting: 'Langkah Seterusnya',
    coachTagline: 'AI Coach telah merancang laluan paling efisien untuk anda',
    yourNextMove: 'Apa yang perlu dilakukan',
    whyThisMatters: 'Mengapa ini penting',
    estimatedTime: 'Anggaran masa',
    completeButton: 'Tandakan Selesai',
    completing: 'Menyelesaikan...',
    journeyComplete: 'Sistem Teras Selesai!',
    journeyCompleteDesc: 'Anda telah menguasai laluan penuh dari jenama ke jualan. Kini besarkan impak anda.',
    beginner: 'Pemula',
    advanced: 'Lanjutan',
    modeHint: 'Mod',
    progressLabel: 'Kemajuan',
    xpLabel: 'XP',
    stageLabel: 'Tahap',
    congratsToast: 'Pencapaian dibuka!',
  },
};

function getStageName(stage: MissionStage, locale: Locale): string {
  return stage.title;
}

function formatTime(minutes: number, locale: Locale): string {
  if (minutes === 0) return locale === 'en' ? 'Auto' : locale === 'ms' ? 'Auto' : '自动完成';
  if (minutes < 60) {
    return locale === 'en' ? `~${minutes} min` : locale === 'ms' ? `~${minutes} min` : `约 ${minutes} 分钟`;
  }
  const hrs = Math.round(minutes / 60);
  return locale === 'en' ? `~${hrs} hr` : locale === 'ms' ? `~${hrs} jam` : `约 ${hrs} 小时`;
}

export function MissionCard({ locale = 'zh', className }: MissionCardProps) {
  const router = useRouter();
  const query = useMissionCurrent();
  const completeMission = useCompleteMission();
  const switchMode = useSwitchMissionMode();
  const t = TEXT[locale];

  const [showAchievementToast, setShowAchievementToast] = React.useState<string | null>(null);

  const data = query.data?.data;
  const mission = data?.currentMission;
  const progress = data?.progress;
  const achievements = data?.achievements ?? [];
  const stage = mission?.stage ?? null;
  const mode = progress?.mode ?? 'beginner';
  const totalStages = ALL_STAGES.filter((s) => s.id !== 'account_approved').length;
  const currentStageOrder = stage ? Math.min(stage.order, totalStages) : totalStages;

  async function handleComplete() {
    if (!stage || completeMission.isPending) return;
    const result = await completeMission.mutateAsync(stage.id);

    if (result.data.newAchievements.length > 0) {
      const achievementNames = result.data.newAchievements.join(', ');
      setShowAchievementToast(achievementNames);
      setTimeout(() => setShowAchievementToast(null), 4000);
    }
  }

  function handleModeToggle(nextMode: UserMode) {
    if (nextMode === mode || switchMode.isPending) return;
    if (nextMode === 'advanced') {
      const confirmed = window.confirm(
        locale === 'en'
          ? 'Advanced mode lets you explore all features freely. The AI Coach will still guide you on the dashboard.'
          : locale === 'ms'
            ? 'Mod lanjutan membolehkan anda meneroka semua ciri secara bebas. AI Coach masih akan membimbing anda.'
            : '高级模式让你自由探索所有功能，AI Coach 仍会在首页引导你。',
      );
      if (!confirmed) return;
    }
    switchMode.mutate(nextMode);
  }

  // ---- Loading State ----
  if (query.isLoading) {
    return (
      <section className={cn('rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm animate-pulse', className)}>
        <div className="h-5 w-40 rounded bg-gray-200 mb-3" />
        <div className="h-8 w-64 rounded bg-gray-200 mb-2" />
        <div className="h-4 w-48 rounded bg-gray-200 mb-6" />
        <div className="h-3 w-full rounded-full bg-gray-200 mb-4" />
        <div className="h-10 w-32 rounded-lg bg-gray-200" />
      </section>
    );
  }

  // ---- Error State ----
  if (query.isError) {
    return (
      <section className={cn('rounded-2xl border border-red-200 bg-red-50 p-6', className)}>
        <p className="text-sm font-medium text-red-700">
          {locale === 'en' ? 'Unable to load mission. Please refresh.' : '无法加载任务，请刷新页面。'}
        </p>
      </section>
    );
  }

  // ---- Journey Complete ----
  if (mission?.isJourneyComplete) {
    return (
      <section className={cn('rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-md', className)}>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-5 w-5 text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
            {t.journeyComplete}
          </span>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">
          {t.journeyCompleteDesc}
        </p>

        {/* Mode toggle */}
        <div className="mt-6 flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--color-text-muted)]">{t.modeHint}</span>
          <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1 shadow-sm">
            {(['beginner', 'advanced'] as UserMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeToggle(m)}
                disabled={switchMode.isPending}
                className={cn(
                  'h-8 rounded-md px-3 text-xs font-semibold transition-colors disabled:opacity-50',
                  mode === m ? 'bg-blue-600 text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]',
                )}
              >
                {m === 'beginner' ? t.beginner : t.advanced}
              </button>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!stage) return null;

  // ---- Active Mission ----
  return (
    <section className={cn('rounded-2xl border border-blue-200 bg-white shadow-lg shadow-blue-100/50 overflow-hidden', className)}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-200" />
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              {t.coachGreeting}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white/90">
            <Trophy className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">{progress?.totalXP ?? 0} {t.xpLabel}</span>
          </div>
        </div>
        <h2 className="mt-2 text-xl font-bold text-white leading-tight">
          {getStageName(stage, locale)}
        </h2>
        <p className="mt-1 text-sm text-blue-200">{t.coachTagline}</p>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">
              {t.progressLabel} · {t.stageLabel} {currentStageOrder}/{totalStages}
            </span>
            <span className="text-xs font-bold text-blue-600">{progress?.progressPercent ?? 0}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
              style={{ width: `${Math.max(0, Math.min(progress?.progressPercent ?? 0, 100))}%` }}
            />
          </div>
        </div>

        {/* Why this matters */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Compass className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                {t.whyThisMatters}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">
                {stage.whyItMatters}
              </p>
            </div>
          </div>
        </div>

        {/* Meta row: time + route */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">
            <Clock className="h-3.5 w-3.5" />
            {t.estimatedTime}: {formatTime(stage.estimatedMinutes, locale)}
          </div>
          <button
            type="button"
            onClick={() => router.push(stage.route)}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            {stage.route} <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[var(--color-border)]">
          {/* Complete button */}
          <button
            type="button"
            onClick={handleComplete}
            disabled={completeMission.isPending}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-sm transition-all',
              'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {completeMission.isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t.completing}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {t.completeButton}
              </>
            )}
          </button>

          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-text-muted)]">{t.modeHint}</span>
            <div className="inline-flex rounded-lg border border-[var(--color-border)] bg-white p-1 shadow-sm">
              {(['beginner', 'advanced'] as UserMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleModeToggle(m)}
                  disabled={switchMode.isPending}
                  className={cn(
                    'h-8 rounded-md px-3 text-xs font-semibold transition-colors disabled:opacity-50',
                    mode === m ? 'bg-gray-800 text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]',
                  )}
                >
                  {m === 'beginner' ? t.beginner : t.advanced}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Achievement Toast */}
      {showAchievementToast && (
        <div className="mx-6 mb-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-3 shadow-lg">
            <Zap className="h-5 w-5 text-white" />
            <div>
              <p className="text-sm font-bold text-white">{t.congratsToast}</p>
              <p className="text-xs text-white/90">{showAchievementToast}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
