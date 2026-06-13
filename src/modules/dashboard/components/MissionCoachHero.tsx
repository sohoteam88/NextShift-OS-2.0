'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Compass,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  useMissionCurrent,
  useCompleteMission,
} from '@/modules/mission-engine/components/MissionCard';
import { ALL_STAGES } from '@/modules/mission-engine/missionStages';
import type { MissionStage } from '@/modules/mission-engine/missionStages';
import type { UserMode } from '@/modules/mission-engine/missionEngineService';

// ============================================================
// Types
// ============================================================

type Locale = 'zh' | 'en' | 'ms';

interface MissionCoachHeroProps {
  locale?: Locale;
  className?: string;
}

// ============================================================
// Copy — Malaysian Chinese friendly business tone
// ============================================================

const TEXT: Record<Locale, {
  greeting: (name: string, hour: number) => string;
  subtitle: string;
  stageLabel: string;
  whyThis: string;
  estimated: string;
  startAction: (name: string) => string;
  continueAction: string;
  completeAction: string;
  completing: string;
  journeyDone: string;
  journeyDoneSub: string;
  xpLabel: string;
}> = {
  zh: {
    greeting: (name, hour) => {
      if (hour < 12) return `早安，${name} ☀️`;
      if (hour < 18) return `下午好，${name} 💪`;
      return `晚上好，${name} 🌙`;
    },
    subtitle: 'AI Coach 陪你一步步把品牌做起来',
    stageLabel: '当前阶段',
    whyThis: '为什么这一步重要',
    estimated: '预计用时',
    startAction: (name) => `开始 ${name}`,
    continueAction: '继续下一步',
    completeAction: '标记完成',
    completing: '完成中...',
    journeyDone: '🎓 核心系统已完成！',
    journeyDoneSub: '你已经建立了从品牌到成交的完整路径。现在是放大规模的时候了。',
    xpLabel: '经验值',
  },
  en: {
    greeting: (name, hour) => {
      if (hour < 12) return `Good morning, ${name} ☀️`;
      if (hour < 18) return `Good afternoon, ${name} 💪`;
      return `Good evening, ${name} 🌙`;
    },
    subtitle: 'AI Coach guides you step by step to build your brand',
    stageLabel: 'Current Stage',
    whyThis: 'Why this matters',
    estimated: 'Estimated time',
    startAction: (name) => `Start ${name}`,
    continueAction: 'Continue Next Step',
    completeAction: 'Mark Complete',
    completing: 'Completing...',
    journeyDone: '🎓 Core System Complete!',
    journeyDoneSub: 'You have built the full path from brand to sale. Now it is time to scale.',
    xpLabel: 'XP',
  },
  ms: {
    greeting: (name, hour) => {
      if (hour < 12) return `Selamat pagi, ${name} ☀️`;
      if (hour < 18) return `Selamat petang, ${name} 💪`;
      return `Selamat malam, ${name} 🌙`;
    },
    subtitle: 'AI Coach membimbing anda langkah demi langkah membina jenama',
    stageLabel: 'Tahap Semasa',
    whyThis: 'Mengapa ini penting',
    estimated: 'Anggaran masa',
    startAction: (name) => `Mula ${name}`,
    continueAction: 'Teruskan Langkah Seterusnya',
    completeAction: 'Tandakan Selesai',
    completing: 'Menyelesaikan...',
    journeyDone: '🎓 Sistem Teras Selesai!',
    journeyDoneSub: 'Anda telah membina laluan penuh dari jenama ke jualan. Kini masa untuk skala.',
    xpLabel: 'XP',
  },
};

// ============================================================
// Helpers
// ============================================================

function formatTime(minutes: number, locale: Locale): string {
  if (minutes === 0) {
    return locale === 'en' ? 'Auto' : locale === 'ms' ? 'Auto' : '自动完成';
  }
  if (minutes < 60) {
    return locale === 'en'
      ? `~${minutes} min`
      : locale === 'ms'
        ? `~${minutes} min`
        : `约 ${minutes} 分钟`;
  }
  const hrs = Math.round(minutes / 60);
  return locale === 'en'
    ? `~${hrs} hr`
    : locale === 'ms'
      ? `~${hrs} jam`
      : `约 ${hrs} 小时`;
}

function getStageTitle(stage: MissionStage, locale: Locale): string {
  // Use the stage title directly — it's already the primary display name
  return stage.title;
}

// ============================================================
// Component
// ============================================================

export function MissionCoachHero({ locale = 'zh', className }: MissionCoachHeroProps) {
  const router = useRouter();
  const query = useMissionCurrent();
  const completeMission = useCompleteMission();
  const t = TEXT[locale];
  const hour = new Date().getHours();

  const data = query.data?.data;
  const mission = data?.currentMission;
  const progress = data?.progress;
  const stage = mission?.stage ?? null;
  const isComplete = mission?.isJourneyComplete ?? false;
  const totalStages = ALL_STAGES.filter((s) => s.id !== 'account_approved').length;
  const stageNum = stage ? Math.min(stage.order, totalStages) : totalStages;

  const [completing, setCompleting] = React.useState(false);

  async function handleCTA() {
    if (!stage || completing) return;

    // If it's a zero-minute stage (auto-complete), mark it complete
    if (stage.estimatedMinutes === 0) {
      setCompleting(true);
      await completeMission.mutateAsync(stage.id);
      setCompleting(false);
      return;
    }

    // Otherwise navigate to the stage route
    router.push(stage.route);
  }

  // ---- Loading ----
  if (query.isLoading) {
    return (
      <section className={cn('rounded-2xl bg-white border border-[var(--color-border)] p-6 animate-pulse', className)}>
        <div className="h-4 w-32 rounded bg-gray-200 mb-3" />
        <div className="h-6 w-48 rounded bg-gray-200 mb-2" />
        <div className="h-4 w-64 rounded bg-gray-200 mb-6" />
        <div className="h-3 w-full rounded-full bg-gray-200 mb-4" />
        <div className="h-11 w-36 rounded-xl bg-gray-200" />
      </section>
    );
  }

  // ---- Error ----
  if (query.isError) {
    return (
      <section className={cn('rounded-2xl border border-red-200 bg-red-50 p-6', className)}>
        <p className="text-sm font-medium text-red-700">
          {locale === 'en'
            ? 'Unable to load mission. Please refresh.'
            : '无法加载任务，请刷新页面。'}
        </p>
      </section>
    );
  }

  // ---- Journey Complete ----
  if (isComplete) {
    return (
      <section className={cn('rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-md', className)}>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">{t.journeyDone}</span>
        </div>
        <p className="text-sm text-emerald-800 leading-relaxed">{t.journeyDoneSub}</p>
        <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
          <Trophy className="h-4 w-4" />
          {progress?.totalXP ?? 0} {t.xpLabel}
        </div>
      </section>
    );
  }

  if (!stage) return null;

  // ---- Active Mission Hero ----
  const ctaLabel = stage.estimatedMinutes === 0
    ? t.completeAction
    : t.startAction(getStageTitle(stage, locale));

  return (
    <section className={cn('rounded-2xl border border-blue-200 bg-white shadow-lg shadow-blue-100/50 overflow-hidden', className)}>
      {/* Header gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-blue-200" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
            {t.stageLabel} {stageNum}/{totalStages}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white leading-tight">
          {t.greeting('', hour).replace(',  ', '，')}
        </h1>
        <p className="mt-1 text-sm text-blue-200">{t.subtitle}</p>

        {/* Stage name + XP */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
              {t.stageLabel}
            </p>
            <h2 className="text-xl font-bold text-white">
              {getStageTitle(stage, locale)}
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
            <Trophy className="h-3.5 w-3.5" />
            {progress?.totalXP ?? 0} {t.xpLabel}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-blue-200">{locale === 'en' ? 'Progress' : locale === 'ms' ? 'Kemajuan' : '完成进度'}</span>
            <span className="text-xs font-bold text-white">{progress?.progressPercent ?? 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white transition-all duration-700 ease-out"
              style={{ width: `${Math.max(0, Math.min(progress?.progressPercent ?? 0, 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        {/* Why this matters */}
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Compass className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                {t.whyThis}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-amber-900">
                {stage.whyItMatters}
              </p>
            </div>
          </div>
        </div>

        {/* Meta + CTA row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
            <Clock className="h-3.5 w-3.5" />
            {t.estimated}: {formatTime(stage.estimatedMinutes, locale)}
          </div>

          <button
            type="button"
            onClick={handleCTA}
            disabled={completing}
            className={cn(
              'inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold shadow-sm transition-all active:scale-[0.98]',
              'bg-blue-600 text-white hover:bg-blue-700',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            {completing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t.completing}
              </>
            ) : (
              <>
                {stage.estimatedMinutes === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                {ctaLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
