'use client';

import * as React from 'react';
import { Target } from 'lucide-react';
import type { FunnelType } from '@/modules/funnel-context/types';
import type { FunnelGoal } from '@/modules/funnel-os/types';
import { FUNNEL_GOALS } from '@/modules/funnel-os/types';

const STORAGE_KEY = 'nextshift.funnelGoals';

function readGoals(): Partial<Record<FunnelType, string>> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Record<FunnelType, string>>;
  } catch {
    return {};
  }
}

function parseTarget(goal: string) {
  const match = goal.match(/\d+/);
  return match ? Number(match[0]) : 1;
}

export function FunnelGoalCard({ funnelType, goal }: { funnelType: FunnelType; goal: FunnelGoal }) {
  const [selectedGoal, setSelectedGoal] = React.useState(goal.goal);
  const options = React.useMemo(() => FUNNEL_GOALS[funnelType] ?? [goal.goal], [funnelType, goal.goal]);
  const target = parseTarget(selectedGoal);
  const progress = Math.min(100, Math.round((goal.current / Math.max(target, 1)) * 100));

  React.useEffect(() => {
    const saved = readGoals()[funnelType];
    setSelectedGoal(saved && options.includes(saved) ? saved : goal.goal);
  }, [funnelType, goal.goal, options]);

  function onChange(next: string) {
    setSelectedGoal(next);
    const goals = readGoals();
    goals[funnelType] = next;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Current Goal</p>
          <h2 className="mt-2 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
            <Target className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            {selectedGoal}
          </h2>
        </div>
        <select
          value={selectedGoal}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-2 text-sm text-[var(--color-text)]"
        >
          {options.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-[var(--color-text-muted)]">Progress to goal</span>
        <span className="font-semibold text-[var(--color-text)]">{goal.current}/{target}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}
