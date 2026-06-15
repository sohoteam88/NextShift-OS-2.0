'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, Lightbulb, Target, Zap } from 'lucide-react';
import { useDashboardMission } from '../hooks/useDashboardMission';
import { useUserEvolution } from '@/modules/user-evolution/hooks/useUserEvolution';
import { EvolutionBadge } from '@/modules/user-evolution/components/EvolutionBadge';
import { AchievementToast } from '@/modules/user-evolution/components/AchievementToast';
import { RoadmapProgressSummary } from '@/modules/growth-roadmap/components/RoadmapProgressSummary';
import { useGrowthRoadmap } from '@/modules/growth-roadmap/hooks/useGrowthRoadmap';
import type { UserLevel } from '@/modules/user-evolution/types/evolution.types';

function useSnapshotLevel(level: UserLevel): string[] {
  switch (level) {
    case 'explorer': return ['content', 'leads', 'customers'];
    case 'builder': return ['content', 'leads', 'leadGrowth'];
    case 'operator': return ['leads', 'customers', 'revenue', 'followUp'];
    case 'leader': return ['revenue', 'pipeline', 'conversion', 'team', 'funnelHealth', 'automation'];
  }
}

export function DashboardV4() {
  const router = useRouter();
  const { nextAction, userLevel, mission, progress, aiCoachMessage, businessSnapshot, isLoading } = useDashboardMission();
  const evolution = useUserEvolution();
  const { roadmap } = useGrowthRoadmap();
  const completedTasks = mission.tasks.filter(t => t.completed).length;
  const totalTasks = mission.tasks.length;
  const snapshotKeys = useSnapshotLevel(userLevel.level);
  const fmt = (n: number) => n.toLocaleString();

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      {/* ── Section 1: Today's Mission (highest priority, full width) ── */}
      <section className="rounded-[var(--radius-lg)] border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-blue-800">Today&apos;s Mission</h2>
        </div>
        <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">{nextAction.title}</h3>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-[var(--color-text-muted)]" />
          <span className="text-sm text-[var(--color-text-muted)]">预计时间：{nextAction.estimatedMinutes} 分钟</span>
        </div>
        <div className="mb-5 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">完成后你将获得：</p>
          {nextAction.outcomes.map((o) => (
            <div key={o} className="flex items-center gap-2 text-sm text-[var(--color-text)]">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />{o}
            </div>
          ))}
        </div>
        <button
          onClick={() => router.push(nextAction.route)}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
        >
          Continue My Growth Journey <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* ── Section 2+3: Progress + AI Coach (side by side) ── */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Growth Roadmap (replaces old Progress) */}
        <RoadmapProgressSummary roadmap={roadmap} />

        {/* AI Coach */}
        <section className="rounded-[var(--radius-lg)] border border-amber-100 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">AI Coach</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--color-text)]">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Mission: {mission.title}</p>
            <p className="text-xs text-amber-600">{completedTasks}/{totalTasks} tasks  ·  {mission.objective}</p>
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-amber-700 mb-1">Why</p>
              <p className="text-[var(--color-text-muted)] leading-relaxed">{aiCoachMessage.why}</p>
            </div>
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-amber-700 mb-1">Outcome</p>
              <p className="text-[var(--color-text-muted)] leading-relaxed">{aiCoachMessage.outcome}</p>
            </div>
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-amber-700 mb-1">Common Mistake</p>
              <p className="text-[var(--color-text-muted)] leading-relaxed">{aiCoachMessage.mistake}</p>
            </div>
            <p className="text-xs text-emerald-600 font-medium italic">✨ {aiCoachMessage.encouragement}</p>
            <p className="text-xs text-amber-600 font-medium">⏱ {aiCoachMessage.time}  ·  {evolution.coachPersona.style.replace('_', ' ')} mode</p>
          </div>
        </section>
      </div>

      {/* ── Section 4: Business Snapshot (lowest priority, full width) ── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">Business Snapshot</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {snapshotKeys.includes('content') && (
            <div className="text-center p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)]">
              <p className="text-lg font-semibold">{fmt(businessSnapshot.content)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Content</p>
            </div>
          )}
          {snapshotKeys.includes('leads') && (
            <div className="text-center p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)]">
              <p className="text-lg font-semibold">{fmt(businessSnapshot.leads)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Leads</p>
            </div>
          )}
          {snapshotKeys.includes('customers') && (
            <div className="text-center p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)]">
              <p className="text-lg font-semibold">{fmt(businessSnapshot.customers)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Customers</p>
            </div>
          )}
          {snapshotKeys.includes('revenue') && (
            <div className="text-center p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)]">
              <p className="text-lg font-semibold">RM {fmt(businessSnapshot.revenue)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Revenue</p>
            </div>
          )}
          {(snapshotKeys.length === 0 || snapshotKeys.length <= 3) && (
            <div className="text-center p-3 rounded-[var(--radius-md)] bg-[var(--color-surface)]">
              <p className="text-lg font-semibold text-[var(--color-text-muted)]">—</p>
              <p className="text-xs text-[var(--color-text-muted)]">More soon</p>
            </div>
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <EvolutionBadge level={evolution.level} className="mr-2" />
          <Link href="/journey" className="text-xs font-medium text-[var(--color-primary)] hover:underline">View Full Growth Map →</Link>
        </div>
      </section>

      {/* Achievement Toast */}
      <AchievementToast
        title={evolution.newAchievement?.title ?? ''}
        description={evolution.newAchievement?.description ?? ''}
        icon={evolution.newAchievement?.icon ?? ''}
        visible={!!evolution.newAchievement}
        onDismiss={evolution.dismissAchievement}
      />
    </div>
  );
}
