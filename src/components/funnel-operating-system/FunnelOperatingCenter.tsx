'use client';

import { useLocale } from 'next-intl';
import { Skeleton } from '@/components/ui/Skeleton';
import { FunnelSelector } from './FunnelSelector';
import { FunnelOperatingCard } from './FunnelOperatingCard';
import { FunnelProgressCard } from './FunnelProgressCard';
import { FunnelGoalCard } from './FunnelGoalCard';
import { FunnelHealthCard } from './FunnelHealthCard';
import { FunnelMilestoneCard } from './FunnelMilestoneCard';
import { useFunnelPreference } from './useFunnelPreference';
import { useFunnelOperatingData } from './useFunnelOperatingData';

type Locale = 'zh' | 'en' | 'ms';

function normalizeLocale(locale: string): Locale {
  if (locale.startsWith('en')) return 'en';
  if (locale.startsWith('ms')) return 'ms';
  return 'zh';
}

export function FunnelKpiStrip({ kpi }: { kpi: Array<{ label: string; value: string; target?: string }> }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {kpi.map((item) => (
        <div key={item.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{item.value}</p>
          {item.target ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">Goal {item.target}</p> : null}
        </div>
      ))}
    </section>
  );
}

export function FunnelOperatingCenter({ locale, showSelector = true }: { locale?: Locale; showSelector?: boolean }) {
  const currentLocale = useLocale();
  const activeLocale = normalizeLocale(locale ?? currentLocale);
  const { funnelType } = useFunnelPreference();
  const query = useFunnelOperatingData(funnelType);
  const data = query.data?.data;

  return (
    <div className="space-y-4">
      {showSelector ? <FunnelSelector locale={activeLocale} /> : null}

      {query.isLoading ? (
        <Skeleton className="h-64 w-full rounded-[var(--radius-lg)]" />
      ) : data ? (
        <>
          <FunnelOperatingCard funnelType={funnelType} progress={data.progress} goal={data.goal} nextAction={data.nextAction} locale={activeLocale} />
          <FunnelKpiStrip kpi={data.kpi} />
          <div className="grid gap-4 xl:grid-cols-3">
            <FunnelProgressCard progress={data.progress} />
            <FunnelGoalCard funnelType={funnelType} goal={data.goal} />
            <FunnelHealthCard health={data.health} progress={data.progress} />
          </div>
          <FunnelMilestoneCard milestones={data.milestones} />
        </>
      ) : (
        <section className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Unable to load Funnel OS. Refresh and try again.
        </section>
      )}
    </div>
  );
}
