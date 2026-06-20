import Link from 'next/link';
import { ArrowRight, Target } from 'lucide-react';
import type { OutcomeMetrics } from '@/modules/value/contracts/ValueProjection';

type MomentumCardProps = {
  metrics: OutcomeMetrics;
  setupHref: string;
};

export function MomentumCard({ metrics, setupHref }: MomentumCardProps) {
  const hasBusinessData = [
    metrics.contentPublished,
    metrics.leadsGenerated,
    metrics.appointmentsBooked,
    metrics.customersAcquired,
    metrics.revenueGenerated,
  ].some((value) => value > 0);
  const items = [
    { label: '已发布内容', value: metrics.contentPublished },
    { label: '潜在客户', value: metrics.leadsGenerated },
    { label: '预约', value: metrics.appointmentsBooked },
    { label: '客户', value: metrics.customersAcquired },
    { label: '收入', value: `RM ${metrics.revenueGenerated}` },
  ];

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-emerald-600" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">Business Momentum</h2>
      </div>
      {hasBusinessData ? (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{item.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <h3 className="text-base font-semibold text-[var(--color-text)]">No Business Data Yet</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
            Complete your AI Interview and first mission. Your business metrics will appear here automatically.
          </p>
          <Link
            href={setupHref}
            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Continue Setup <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
