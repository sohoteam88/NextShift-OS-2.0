'use client';

import { CheckCircle2, Circle, Trophy } from 'lucide-react';
import type { FunnelMilestone } from '@/modules/funnel-os/types';
import { cn } from '@/lib/cn';

export function FunnelMilestoneCard({ milestones }: { milestones: FunnelMilestone[] }) {
  const completed = milestones.filter((item) => item.completed).length;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Milestones</p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--color-text)]">First success path</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
          <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
          {completed}/{milestones.length}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {milestones.map((item) => {
          const Icon = item.completed ? CheckCircle2 : Circle;
          return (
            <div
              key={item.id}
              className={cn(
                'flex min-h-12 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm',
                item.completed
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-text-muted)]',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

