import type React from 'react';
import { AlertTriangle, CheckCircle2, CircleDot, Lightbulb, ListChecks, Users } from 'lucide-react';
import type { BetaCommandCenterData, BetaHealthTone, BetaMetric, BetaReportItem } from '@/modules/admin/services/beta-command-service';
import { cn } from '@/lib/cn';

const toneClass: Record<BetaHealthTone, string> = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  yellow: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-red-200 bg-red-50 text-red-700',
};

function MetricCard({ metric }: { metric: BetaMetric }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{metric.value}</p>
        </div>
        <span className={cn('rounded-full border px-2 py-1 text-xs font-semibold', toneClass[metric.rate > 80 ? 'green' : metric.rate >= 50 ? 'yellow' : 'red'])}>
          {metric.rate}%
        </span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
        <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.min(metric.rate, 100)}%` }} />
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-muted)]">Target cohort: {metric.denominator}</p>
    </section>
  );
}

function ReportList({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: BetaReportItem[];
}) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[var(--color-primary)]">{icon}</span>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">{item.label}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{item.detail}</p>
              </div>
              <span className={cn('shrink-0 rounded-full border px-2 py-1 text-xs font-semibold', toneClass[item.severity])}>
                {item.count}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BetaCommandCenter({ data }: { data: BetaCommandCenterData }) {
  const HealthIcon = data.healthTone === 'green' ? CheckCircle2 : data.healthTone === 'yellow' ? AlertTriangle : CircleDot;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Closed Beta</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Beta Command Center</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Track beta user success, activation, business outcomes, and where users get stuck.
          </p>
        </div>
        <div className={cn('inline-flex items-center gap-2 rounded-[var(--radius-lg)] border px-4 py-3 shadow-sm', toneClass[data.healthTone])}>
          <HealthIcon className="h-5 w-5" aria-hidden="true" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">Beta Health Score</p>
            <p className="text-2xl font-semibold">{data.healthScore}%</p>
          </div>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Where are users stuck?</h2>
        </div>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          The highest-count gaps below show the steps blocking beta users from first lead, first customer, or first member.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-3">
        <ReportList title="Top 5 bottlenecks" icon={<ListChecks className="h-5 w-5" aria-hidden="true" />} items={data.bottlenecks} />
        <ReportList title="Top 5 requested features" icon={<Lightbulb className="h-5 w-5" aria-hidden="true" />} items={data.requestedFeatures} />
        <ReportList title="Top 5 UX problems" icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />} items={data.uxProblems} />
      </div>
    </div>
  );
}
