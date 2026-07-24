import Link from 'next/link';
import { ArrowRight, Check, Circle } from 'lucide-react';
import type { DashboardProjection } from '../adapters/DashboardProjectionAdapter';

type JourneyStatus = 'completed' | 'current' | 'next';

function journeyLabel(value: string) {
  return value.replace(/引流磁铁/g, '引流资源');
}

export function buildJourneySteps(progressPath: DashboardProjection['progressPath']) {
  const currentIndex = progressPath.findIndex((step) => step.status === 'current');
  const completed = progressPath.filter((step) => step.status === 'completed').at(-1);
  const current = currentIndex >= 0 ? progressPath[currentIndex] : progressPath.find((step) => step.status !== 'completed');
  const next = currentIndex >= 0 ? progressPath.slice(currentIndex + 1).find((step) => step.status !== 'completed') : undefined;
  return [
    completed ? { label: journeyLabel(completed.label), status: 'completed' as const } : null,
    current ? { label: journeyLabel(current.label), status: 'current' as const } : null,
    next ? { label: journeyLabel(next.label), status: 'next' as const } : null,
  ].filter((step): step is { label: string; status: JourneyStatus } => step !== null);
}

export function JourneyProgressCard({ steps }: { steps: Array<{ label: string; status: JourneyStatus }> }) {
  if (steps.length === 0) return null;
  return (
    <Link href="/journey" className="block rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 shadow-sm hover:bg-[var(--color-surface)]">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {steps.map((step, index) => (
          <div key={`${step.status}-${step.label}`} className="flex items-center gap-2">
            {index > 0 ? <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" aria-hidden="true" /> : null}
            {step.status === 'completed' ? <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <Circle className={`h-4 w-4 ${step.status === 'current' ? 'fill-blue-600 text-blue-600' : 'text-[var(--color-text-muted)]'}`} aria-hidden="true" />}
            <span className={step.status === 'current' ? 'font-semibold text-[var(--color-text)]' : 'text-[var(--color-text-muted)]'}>{step.label}</span>
          </div>
        ))}
        <span className="ml-auto text-xs font-semibold text-blue-700">查看成长路线</span>
      </div>
    </Link>
  );
}
