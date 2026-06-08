'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';
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

type DailyProgress = {
  completedCount: number;
  totalCount: number;
  allCompleted: boolean;
  hasData: boolean;
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

function useDailyActions() {
  return useQuery({
    queryKey: ['daily-actions-today'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/daily-actions');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ data: DailyProgress }>;
    },
    staleTime: 60_000,
  });
}

export function AICoachCard({ userName }: { userName: string }) {
  const { data: recData, isLoading: recLoading, error } = useCoachRecommendation();
  const { data: dailyData, isLoading: dailyLoading } = useDailyActions();

  if (error) return null;

  const rec = recData?.data;
  const daily = dailyData?.data;
  const remaining = (daily?.totalCount ?? 0) - (daily?.completedCount ?? 0);
  const isLoading = recLoading || dailyLoading;

  const recommendedActions = [
    rec ? { label: rec.actionLabel, href: rec.actionHref, time: rec.estimatedMinutes } : null,
    { label: '跟进潜在客户', href: '/crm', time: 10 },
    { label: '发布一条内容', href: '/ai', time: 5 },
  ].filter(Boolean) as { label: string; href: string; time: number }[];

  return (
    <div className="rounded-[var(--radius-lg)] border border-blue-200 bg-blue-50 p-5 shadow-[var(--shadow-sm)]">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg leading-none">🤖</span>
        <span className="font-semibold text-[var(--color-text)]">AI Coach</span>
        {!isLoading && remaining > 0 && (
          <span className="ml-auto rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white">
            {remaining} 项待完成
          </span>
        )}
      </div>

      {/* Coaching message */}
      {isLoading ? (
        <div className="mb-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ) : (
        <p className="mb-4 text-sm leading-relaxed text-[var(--color-text)]">
          {remaining > 0
            ? `你今天还有 ${remaining} 项任务未完成。完成后，系统会帮你推进内容发布、客户跟进与成交节奏。`
            : `太棒了，${userName}！今日任务全部完成。继续保持，系统将为你规划明天的重点行动。`}
        </p>
      )}

      {/* 3 recommended actions */}
      <div className="mb-4 space-y-2">
        {recommendedActions.slice(0, 3).map((action) => (
          <Link
            key={action.href + action.label}
            href={action.href}
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-blue-200 bg-white px-3 py-2.5 text-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
          >
            <span className="font-medium text-[var(--color-text)]">{action.label}</span>
            <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              <Clock className="h-3 w-3" />
              {action.time}分
              <ChevronRight className="ml-0.5 h-3.5 w-3.5 text-[var(--color-primary)]" />
            </span>
          </Link>
        ))}
      </div>

      {rec && (
        <p className="mb-3 text-xs text-[var(--color-text-muted)]">
          预计完成时间：{rec.estimatedMinutes + 15} 分钟
        </p>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Link
          href="/member"
          className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          查看今日任务
        </Link>
        <Link
          href="/ai/coach"
          className="flex-1 rounded-[var(--radius-md)] border border-blue-300 bg-white py-2.5 text-center text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100"
        >
          让 AI 帮我规划
        </Link>
      </div>
    </div>
  );
}
