'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';

type Recommendation = {
  type: string;
  goal: string;
  reason: string;
  estimatedMinutes: number;
  actionLabel: string;
  actionHref: string;
  urgency: 'high' | 'medium' | 'low';
};

function useCoachRecommendation() {
  return useQuery({
    queryKey: ['ai-coach-recommend'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/coach/recommend');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ data: Recommendation }>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

const URGENCY_STYLES = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-blue-200 bg-blue-50',
  low: 'border-[var(--color-border)] bg-white',
};

const URGENCY_BADGE = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-600',
};

const URGENCY_LABEL = {
  high: '紧急',
  medium: '今日',
  low: '建议',
};

export function AICoachCard({ userName }: { userName: string }) {
  const { data, isLoading, error } = useCoachRecommendation();
  const rec = data?.data;

  if (error) return null;

  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[var(--shadow-sm)]">
        <Skeleton className="mb-3 h-4 w-24" />
        <Skeleton className="mb-2 h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-4 h-10 w-28" />
      </div>
    );
  }

  if (!rec) return null;

  return (
    <div
      className={`rounded-[var(--radius-lg)] border p-5 shadow-[var(--shadow-sm)] ${URGENCY_STYLES[rec.urgency]}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-text-muted)]">
          AI Coach · {userName}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${URGENCY_BADGE[rec.urgency]}`}
        >
          {URGENCY_LABEL[rec.urgency]}
        </span>
      </div>

      <p className="mb-1 text-sm font-medium text-[var(--color-text-muted)]">今天的目标</p>
      <p className="text-lg font-semibold text-[var(--color-text)]">{rec.goal}</p>

      <p className="mt-1.5 text-sm text-[var(--color-text-muted)]">{rec.reason}</p>

      <div className="mt-1 text-xs text-[var(--color-text-muted)]">
        预计时间：{rec.estimatedMinutes} 分钟
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Link
          href={rec.actionHref}
          className="inline-flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
        >
          {rec.actionLabel}
        </Link>
        <button
          type="button"
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
          onClick={() => {/* postpone — future: update DB state */}}
        >
          稍后再说
        </button>
      </div>
    </div>
  );
}
