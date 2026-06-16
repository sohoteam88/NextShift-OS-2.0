'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, Circle, Clock, Star, Trophy, Zap } from 'lucide-react';
import { useActivation } from '../hooks/useActivation';
import { DAY_MISSIONS } from '../services/activation-service';
import { cn } from '@/lib/cn';

export function ActivationDashboard() {
  const router = useRouter();
  const { currentDay, dayMission, score, activationLevel, totalDays, progressPercent, isLoading } = useActivation();

  if (isLoading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  if (!dayMission) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <Trophy className="h-10 w-10 text-amber-500 mb-4" />
        <h1 className="text-xl font-semibold text-[var(--color-text)]">恭喜完成 7 天激活计划！</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">你已经建立了完整的业务基础。继续在仪表盘探索更多功能。</p>
      </div>
    );
  }

  const levelLabel = activationLevel === 'at_risk' ? '需要关注' : activationLevel === 'engaged' ? '已参与' : '已激活';
  const levelColor = activationLevel === 'at_risk' ? 'text-red-600 bg-red-50' : activationLevel === 'engaged' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50';

  return (
    <div className="mx-auto max-w-2xl space-y-5 pb-8">
      {/* Welcome */}
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">欢迎来到 NextShift</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">第 {currentDay} 天 / {totalDays} 天 — 完成 7 天计划，建立你的业务基础。</p>
      </div>

      {/* Progress */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">{progressPercent}%</span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', levelColor)}>{levelLabel} · {score} 分</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--color-surface)] overflow-hidden">
          <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="flex justify-between mt-3">
          {DAY_MISSIONS.map(m => {
            const complete = m.day < currentDay;
            const current = m.day === currentDay;
            return (
              <div key={m.day} className="text-center">
                <div className={cn('mx-auto h-6 w-6 rounded-full flex items-center justify-center text-xs', complete ? 'bg-emerald-500 text-white' : current ? 'bg-blue-500 text-white ring-2 ring-blue-200' : 'bg-gray-200 text-gray-400')}>
                  {complete ? '✓' : m.day}
                </div>
                <p className="mt-1 text-[9px] text-gray-400">Day {m.day}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Mission */}
      <section className="rounded-[var(--radius-lg)] border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white p-6 shadow-sm text-center">
        <Zap className="mx-auto h-8 w-8 text-blue-600 mb-3" />
        <h2 className="text-lg font-bold text-[var(--color-text)] mb-1">{dayMission.title}</h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">{dayMission.description}</p>
        <div className="flex items-center justify-center gap-4 text-xs text-[var(--color-text-muted)] mb-4">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{dayMission.estimatedMinutes} 分钟</span>
          <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" />{dayMission.reward}</span>
        </div>
        <button
          onClick={() => router.push(dayMission.route)}
          className="inline-flex h-12 items-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-8 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          开始 <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      {/* Checklist */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold mb-3">7 天激活清单</h3>
        <div className="space-y-2 text-sm">
          {DAY_MISSIONS.map(m => {
            const complete = m.day < currentDay;
            const current = m.day === currentDay;
            return (
              <div key={m.day} className={cn('flex items-center gap-2', complete ? 'text-emerald-600' : current ? 'text-blue-600 font-medium' : 'text-gray-400')}>
                {complete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                {m.title} {complete && <span className="text-xs">— {m.reward}</span>}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
