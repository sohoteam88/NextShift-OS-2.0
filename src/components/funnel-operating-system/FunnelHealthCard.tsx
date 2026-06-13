'use client';

import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { FunnelHealth, FunnelProgress } from '@/modules/funnel-os/types';
import { cn } from '@/lib/cn';

function scoreTone(score: number) {
  if (score >= 70) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 40) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

export function FunnelHealthCard({ health, progress }: { health: FunnelHealth; progress: FunnelProgress }) {
  const healthy = health.overallScore >= 70;
  const Icon = healthy ? CheckCircle2 : AlertTriangle;

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Funnel Health</p>
          <h2 className="mt-2 flex items-center gap-2 text-2xl font-semibold text-[var(--color-text)]">
            <Activity className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            {health.overallScore}
          </h2>
        </div>
        <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold', scoreTone(health.overallScore))}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {healthy ? 'Healthy' : 'Needs work'}
        </span>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {[
          ['Traffic', health.traffic],
          ['Content', health.content],
          ['Conversion', health.conversion],
          ['Follow-up', health.followUp],
          ['Pipeline', health.pipeline],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[var(--color-text-muted)]">{label}</span>
              <span className="font-semibold text-[var(--color-text)]">{value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
        <span className="font-semibold">Current Bottleneck:</span> {progress.bottleneck ?? 'No major bottleneck'}
        {progress.bottleneckFix ? <span> · {progress.bottleneckFix}</span> : null}
      </div>
    </section>
  );
}

