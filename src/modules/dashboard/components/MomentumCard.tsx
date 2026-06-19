import { Target } from 'lucide-react';
import type { OutcomeMetrics } from '@/modules/value/contracts/ValueProjection';

type MomentumCardProps = {
  metrics: OutcomeMetrics;
};

export function MomentumCard({ metrics }: MomentumCardProps) {
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
        <h2 className="text-base font-semibold text-[var(--color-text)]">业务动能</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
