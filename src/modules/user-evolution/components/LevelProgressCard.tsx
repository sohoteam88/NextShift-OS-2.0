'use client';

import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { EvolutionBadge } from './EvolutionBadge';
import type { UserLevel } from '../types/evolution.types';

type Props = {
  level: UserLevel;
  progress: number;
  nextMilestone: string;
  unlockedCount: number;
  totalModules: number;
};

export function LevelProgressCard({ level, progress, nextMilestone, unlockedCount, totalModules }: Props) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <EvolutionBadge level={level} />
        <span className="text-xs text-[var(--color-text-muted)]">{unlockedCount}/{totalModules} modules</span>
      </div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-[var(--color-text-muted)]">Next: {nextMilestone.replace(/_/g, ' ')}</span>
        <ArrowRight className="h-3 w-3 text-[var(--color-text-muted)]" />
      </div>
      <div className="h-1.5 w-full rounded-full bg-[var(--color-surface)] overflow-hidden">
        <div className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{progress}% complete</p>
    </div>
  );
}
