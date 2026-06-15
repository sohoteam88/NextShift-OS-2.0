'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Circle, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { GrowthRoadmapState } from '../types/roadmap.types';

type Props = { roadmap: GrowthRoadmapState };

export function RoadmapProgressSummary({ roadmap }: Props) {
  const visibleSteps = roadmap.steps.filter(s => s.status !== 'locked').slice(0, 7);
  const lockedCount = roadmap.steps.filter(s => s.status === 'locked').length;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">Growth Roadmap</h3>
        <Link href="/journey" className="text-xs font-medium text-[var(--color-primary)] hover:underline flex items-center gap-1">View Full Map <ArrowRight className="h-3 w-3" /></Link>
      </div>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-[var(--color-text-muted)]">Step {roadmap.currentStep.stepNumber} of {roadmap.totalSteps}</span>
        <span className="font-semibold text-[var(--color-text)]">{roadmap.progressPercentage}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-[var(--color-surface)] overflow-hidden mb-3">
        <div className="h-full rounded-full bg-[var(--color-primary)] transition-all" style={{ width: `${roadmap.progressPercentage}%` }} />
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {visibleSteps.map(s => {
          const Icon = s.status === 'completed' ? CheckCircle2 : s.status === 'current' ? Circle : Circle;
          return (
            <div key={s.id} className={cn('flex items-center gap-1 text-[10px]', s.status === 'completed' ? 'text-emerald-600' : s.status === 'current' ? 'text-[var(--color-primary)] font-semibold' : 'text-gray-400')}>
              <Icon className="h-3 w-3" />{s.title}
            </div>
          );
        })}
        {lockedCount > 0 && <span className="text-[10px] text-gray-400 flex items-center gap-1"><Lock className="h-3 w-3" />+{lockedCount} locked</span>}
      </div>
    </div>
  );
}
