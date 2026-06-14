'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { useMissionCurrent } from '@/modules/mission-engine/components/MissionCard';
import { ALL_STAGES, getStageById } from '@/modules/mission-engine/missionStages';
import { cn } from '@/lib/cn';

type Locale = 'zh' | 'en' | 'ms';

function labels(locale: Locale) {
  if (locale === 'en') return { nextMission: 'Next Mission', complete: 'Complete', continue: 'Continue', noMissions: 'Start your journey to unlock missions.' };
  if (locale === 'ms') return { nextMission: 'Misi Seterusnya', complete: 'Selesai', continue: 'Teruskan', noMissions: 'Mulakan perjalanan anda untuk membuka misi.' };
  return { nextMission: '下一个任务', complete: '完成', continue: '继续', noMissions: '开始你的旅程以解锁任务。' };
}

export function JourneyProgress({ locale = 'zh' }: { locale?: Locale }) {
  const t = labels(locale);
  const q = useMissionCurrent();
  const data = q.data?.data;
  const progress = data?.progress;
  const mission = data?.currentMission;
  const nextStageId = progress?.nextStageId as string | undefined;
  const nextStage = nextStageId ? getStageById(nextStageId as any) : null;

  // Calculate progress
  const totalStages = ALL_STAGES.length;
  const completedStages = progress?.completedStages ?? 0;
  const progressPct = progress?.progressPercent ?? 0;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--color-text)]">
              {completedStages}/{totalStages} {t.complete}
            </span>
            <span className="text-sm font-semibold text-[var(--color-primary)]">{progressPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--color-surface)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="mt-3 flex items-center gap-2">
            {ALL_STAGES.slice(0, Math.min(5, ALL_STAGES.length)).map((stage, i) => {
              const isComplete = i < completedStages;
              const isCurrent = i === Math.max(0, completedStages);
              return (
                <div key={stage.id} className={cn('flex items-center gap-1 text-xs', isComplete ? 'text-emerald-600' : isCurrent ? 'text-[var(--color-primary)] font-medium' : 'text-[var(--color-text-muted)]')}>
                  {isComplete ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                  <span className="hidden sm:inline">{stage.title}</span>
                </div>
              );
            })}
            {ALL_STAGES.length > 5 && <span className="text-xs text-[var(--color-text-muted)]">+{ALL_STAGES.length - 5}</span>}
          </div>
        </div>
        {nextStage && (
          <Link
            href={nextStage.route ?? '/journey'}
            className="flex shrink-0 items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-primary)] hover:bg-blue-100"
          >
            {t.continue} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
      {!mission && (
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">{t.noMissions}</p>
      )}
    </div>
  );
}
