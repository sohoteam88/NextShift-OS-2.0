'use client';

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

type Props = {
  title: string;
  description?: string;
  data: Array<{ name: string; value: number; rate: number; color?: string }>;
  loading?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  height?: number;
};

export function ConversionFunnelChart({
  title,
  description,
  data,
  loading = false,
  emptyTitle,
  emptyDescription,
  height = 280,
}: Props) {
  if (loading) {
    return (
      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <Skeleton className="h-5 w-36" />
        {description && <Skeleton className="h-4 w-64" />}
        <Skeleton className="h-[280px] w-full" />
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
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value, name, item) => [`${value}`, `${item.payload.rate}%`]} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color ?? '#2563eb'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
