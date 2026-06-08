'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

type Props = {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number; color?: string }>;
  loading?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  height?: number;
};

export function PieDistributionChart({
  title,
  description,
  data,
  loading = false,
  emptyTitle,
  emptyDescription,
  height = 260,
}: Props) {
  if (loading) {
    return (
      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <Skeleton className="h-5 w-36" />
        {description && <Skeleton className="h-4 w-64" />}
        <Skeleton className="h-[260px] w-full rounded-[var(--radius-full)]" />
      </section>
    );
  }

  if (!data.length) {
    return (
      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
          {description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>}
        </div>
        <EmptyState title={emptyTitle} description={emptyDescription} className="min-h-48 border-dashed bg-[var(--color-surface)]" />
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>}
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={entry.color ?? `hsl(${(index * 47) % 360} 78% 52%)`} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
