'use client';

import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

type Props = {
  title: string;
  description?: string;
  data: Array<{ dayIndex: number; blockIndex: number; value: number }>;
  dayLabels: string[];
  blockLabels: string[];
  loading?: boolean;
  emptyTitle: string;
  emptyDescription?: string;
};

const intensity = [
  'bg-[var(--color-surface)]',
  'bg-blue-50',
  'bg-blue-100',
  'bg-blue-200',
  'bg-blue-300',
  'bg-blue-400 text-white',
];

export function HeatmapGrid({
  title,
  description,
  data,
  dayLabels,
  blockLabels,
  loading = false,
  emptyTitle,
  emptyDescription,
}: Props) {
  if (loading) {
    return (
      <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <Skeleton className="h-5 w-36" />
        {description && <Skeleton className="h-4 w-64" />}
        <Skeleton className="h-80 w-full" />
      </section>
    );
  }

  if (!data.length || data.every((cell) => cell.value === 0)) {
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

  const max = Math.max(...data.map((cell) => cell.value), 1);

  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
        {description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>}
      </div>

      <div className="grid gap-2 overflow-x-auto">
        <div className="grid grid-cols-[minmax(72px,24vw)_repeat(4,minmax(0,1fr))] gap-2 md:grid-cols-[120px_repeat(4,minmax(0,1fr))]">
          <div />
          {blockLabels.map((label) => (
            <div key={label} className="text-xs font-medium text-[var(--color-text-muted)]">
              {label}
            </div>
          ))}
        </div>
        {dayLabels.map((dayLabel, dayIndex) => (
          <div key={dayLabel} className="grid grid-cols-[minmax(72px,24vw)_repeat(4,minmax(0,1fr))] gap-2 md:grid-cols-[120px_repeat(4,minmax(0,1fr))]">
            <div className="flex items-center text-sm font-medium text-[var(--color-text)]">{dayLabel}</div>
            {blockLabels.map((blockLabel, blockIndex) => {
              const cell = data.find((item) => item.dayIndex === dayIndex && item.blockIndex === blockIndex);
              const value = cell?.value ?? 0;
              const ratio = value / max;
              const tone = Math.min(intensity.length - 1, Math.max(0, Math.floor(ratio * (intensity.length - 1))));
              return (
                <div
                  key={blockLabel}
                  className={`flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] text-sm font-medium ${intensity[tone]}`}
                >
                  {value > 0 ? value : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
