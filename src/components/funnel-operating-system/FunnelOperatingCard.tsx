'use client';

import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { useLocale } from 'next-intl';
import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';
import type { FunnelGoal, FunnelNextAction, FunnelProgress } from '@/modules/funnel/types/funnel-os';
import { getFunnelLabel } from './FunnelSelector';

type Locale = 'zh' | 'en' | 'ms';

function normalizeLocale(locale: string): Locale {
  if (locale.startsWith('en')) return 'en';
  if (locale.startsWith('ms')) return 'ms';
  return 'zh';
}

export function FunnelOperatingCard({
  funnelType,
  progress,
  goal,
  nextAction,
  locale,
}: {
  funnelType: BusinessFunnelType;
  progress: FunnelProgress;
  goal: FunnelGoal;
  nextAction: FunnelNextAction;
  locale?: Locale;
}) {
  const currentLocale = useLocale();
  const activeLocale = normalizeLocale(locale ?? currentLocale);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Current Funnel</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{getFunnelLabel(funnelType, activeLocale)}</h1>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-4xl font-semibold text-[var(--color-text)]">{progress.progress}%</span>
            <span className="pb-1 text-sm text-[var(--color-text-muted)]">built</span>
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Current Goal</p>
          <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">{goal.goal}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{goal.current}/{goal.target} reached</p>
        </div>

        <div className="rounded-[var(--radius-md)] border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Next Action</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
            <Zap className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            {nextAction.action}
          </p>
          <p className="mt-1 text-sm text-blue-700">Expected Impact: {nextAction.expectedImpact}</p>
          {nextAction.route ? (
            <Link href={nextAction.route} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-primary)]">
              Start now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
