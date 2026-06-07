'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';

type Props = {
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
};

const tones: Record<NonNullable<Props['tone']>, string> = {
  default: 'border-[var(--color-border)] bg-white',
  success: 'border-emerald-200 bg-emerald-50',
  warning: 'border-amber-200 bg-amber-50',
  danger: 'border-red-200 bg-red-50',
  info: 'border-blue-200 bg-blue-50',
};

export function AnalyticsMetricCard({ label, value, hint, loading = false, tone = 'default' }: Props) {
  return (
    <div className={cn('rounded-[var(--radius-lg)] border p-4 shadow-sm', tones[tone])}>
      <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
      {loading ? <Skeleton className="mt-2 h-8 w-24" /> : <p className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{value}</p>}
      {hint && <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}
