'use client';

import { cn } from '@/lib/cn';
import type { UserLevel } from '../types/evolution.types';

const CONFIG: Record<UserLevel, { label: string; emoji: string; color: string }> = {
  explorer: { label: 'Explorer', emoji: '🧭', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  builder: { label: 'Builder', emoji: '🏗️', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  operator: { label: 'Operator', emoji: '⚙️', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  leader: { label: 'Leader', emoji: '🚀', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

type Props = { level: UserLevel; className?: string };

export function EvolutionBadge({ level, className }: Props) {
  const c = CONFIG[level] ?? CONFIG.explorer;
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold', c.color, className)}>
      {c.emoji} {c.label}
    </span>
  );
}
