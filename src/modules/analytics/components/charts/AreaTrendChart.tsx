'use client';

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

type TrendSeries = {
  key: string;
  label: string;
  color: string;
};

type Props = {
  title: string;
  description?: string;
  data: Array<Record<string, string | number>>;
  series: TrendSeries[];
  loading?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  height?: number;
};

export function AreaTrendChart({
  title,
  description,
  data,
  series,
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
        <Skeleton className="h-[260px] w-full" />
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
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} minTickGap={16} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
            <Tooltip />
            {series.map((item, index) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                name={item.label}
                stroke={item.color}
                fill={item.color}
                fillOpacity={index === 0 ? 0.18 : 0.06}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
