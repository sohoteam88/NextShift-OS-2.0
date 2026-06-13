'use client';

import { ArrowRight } from 'lucide-react';
import type { FunnelProgress } from '@/modules/funnel-os/types';

const STAGE_LABELS: Record<string, string> = {
  brand_setup: 'Brand Setup',
  content: 'Content',
  video: 'Video',
  lead_magnet: 'Lead Magnet',
  funnel: 'Funnel',
  webinar: 'Webinar',
  lead: 'Lead',
  customer: 'Customer',
  member: 'Member',
  builder: 'Builder',
  community: 'Community',
  repeat: 'Repeat Customer',
};

function stageLabel(stage: string) {
  return STAGE_LABELS[stage] ?? stage;
}

export function FunnelProgressCard({ progress }: { progress: FunnelProgress }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Funnel Progress</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{progress.progress}%</h2>
        </div>
        <div className="text-right text-sm">
          <p className="font-semibold text-[var(--color-text)]">{stageLabel(progress.currentStage)}</p>
          <p className="mt-1 flex items-center gap-1 text-[var(--color-text-muted)]">
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            {stageLabel(progress.nextStage)}
          </p>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
        <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${progress.progress}%` }} />
      </div>
    </section>
  );
}

