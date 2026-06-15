'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Clock, Lightbulb, Zap } from 'lucide-react';
import { useDashboardMission } from '../hooks/useDashboardMission';
import { useUserEvolution } from '@/modules/user-evolution/hooks/useUserEvolution';
import { AchievementToast } from '@/modules/user-evolution/components/AchievementToast';
import { RoadmapProgressSummary } from '@/modules/growth-roadmap/components/RoadmapProgressSummary';
import { useGrowthRoadmap } from '@/modules/growth-roadmap/hooks/useGrowthRoadmap';

export function DashboardV4() {
  const router = useRouter();
  const { nextAction, mission, aiCoachMessage, isLoading } = useDashboardMission();
  const evolution = useUserEvolution();
  const { roadmap } = useGrowthRoadmap();
  const completedTasks = mission.tasks.filter(t => t.completed).length;
  const totalTasks = mission.tasks.length;

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      {/* ── Section 1: Today's Mission (highest priority, full width) ── */}
      <section className="rounded-[var(--radius-lg)] border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-blue-800">今日任务</h2>
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
          继续成长旅程 <ArrowRight className="h-4 w-4" />
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
            <h2 className="text-base font-semibold text-[var(--color-text)]">AI 教练</h2>
          </div>
          <div className="space-y-3 text-sm text-[var(--color-text)]">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">当前任务：{mission.title}</p>
            <p className="text-xs text-amber-600">{completedTasks}/{totalTasks} 个任务  ·  {mission.objective}</p>
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-amber-700 mb-1">为什么</p>
              <p className="text-[var(--color-text-muted)] leading-relaxed">{aiCoachMessage.why}</p>
            </div>
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-amber-700 mb-1">预期结果</p>
              <p className="text-[var(--color-text-muted)] leading-relaxed">{aiCoachMessage.outcome}</p>
            </div>
            <div>
              <p className="font-semibold text-xs uppercase tracking-widest text-amber-700 mb-1">常见错误</p>
              <p className="text-[var(--color-text-muted)] leading-relaxed">{aiCoachMessage.mistake}</p>
            </div>
            <p className="text-xs text-emerald-600 font-medium italic">✨ {aiCoachMessage.encouragement}</p>
            <p className="text-xs text-amber-600 font-medium">⏱ {aiCoachMessage.time}  ·  {evolution.coachPersona.style.replace('_', ' ')} 模式</p>
          </div>
        </section>
      </div>

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
