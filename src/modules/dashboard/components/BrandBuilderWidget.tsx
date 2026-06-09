'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { WIZARD_STEPS } from '@/modules/brand-builder/services/wizard-state-service';
import type { BrandBuilderState } from '@/modules/brand-builder/services/wizard-state-service';

type TodayContent = {
  id: string;
  title: string;
  pillar: string;
  pillarEmoji: string;
  platform: string;
  format: string;
  hook?: string | null;
};

function useBrandBuilderState() {
  return useQuery({
    queryKey: ['brand-builder-wizard'],
    queryFn: async () => {
      const res = await fetch('/api/v1/brand-builder/wizard');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ data: { state: BrandBuilderState } }>;
    },
    staleTime: 2 * 60 * 1000,
  });
}

function useTodayContent() {
  return useQuery({
    queryKey: ['brand-builder-today'],
    queryFn: async () => {
      const res = await fetch('/api/v1/brand-builder/calendar/today');
      if (!res.ok) return null;
      const j = (await res.json()) as { data: TodayContent | null };
      return j.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

function WizardProgressWidget({ state }: { state: BrandBuilderState }) {
  const isComplete = !!state.completed_at;
  const completed = state.completed_steps.length;
  const total = WIZARD_STEPS.length;
  const pct = Math.round((completed / total) * 100);
  const nextStep = WIZARD_STEPS[Math.min(state.current_step - 1, total - 1)];

  if (isComplete) return null;

  return (
    <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">🏗️</span>
          <span className="text-sm font-semibold text-[var(--color-text)]">品牌建设进度</span>
        </div>
        <span className="text-xs font-medium text-amber-700">
          {completed}/{total} 完成
        </span>
      </div>

      <div className="mb-3 h-2 w-full rounded-full bg-amber-100">
        <div
          className="h-2 rounded-full bg-amber-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mb-3 text-xs text-[var(--color-text-muted)]">
        下一步：{nextStep?.name ?? '完成'}
      </p>

      <Link
        href="/brand-builder"
        className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
      >
        继续设置 <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

function TodayContentWidget({ content }: { content: TodayContent }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-green-200 bg-green-50 p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg leading-none">📅</span>
        <span className="text-sm font-semibold text-[var(--color-text)]">今日内容任务</span>
      </div>
      <div className="mb-3 rounded-[var(--radius-md)] border border-green-200 bg-white p-3">
        <div className="flex items-start gap-2">
          <span className="text-base leading-none">{content.pillarEmoji}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--color-text)] line-clamp-2">{content.title}</p>
            {content.hook && (
              <p className="mt-1 text-xs text-[var(--color-text-muted)] line-clamp-1">
                💡 {content.hook}
              </p>
            )}
            <p className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-text-muted)]">
              {content.platform} · {content.format}
            </p>
          </div>
        </div>
      </div>
      <Link
        href="/brand-builder/calendar"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-900"
      >
        查看完整日历 <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export function BrandBuilderWidget() {
  const { data: wizardData, isLoading: wizardLoading } = useBrandBuilderState();
  const { data: todayContent, isLoading: todayLoading } = useTodayContent();

  if (wizardLoading || todayLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  const state = wizardData?.data?.state;

  // Show wizard progress if not complete
  if (state && !state.completed_at) {
    return <WizardProgressWidget state={state} />;
  }

  // Show today's content if wizard complete and content exists
  if (todayContent) {
    return <TodayContentWidget content={todayContent} />;
  }

  // Wizard complete but no today's content — show quick link
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">✅</span>
          <span className="text-sm font-semibold text-[var(--color-text)]">品牌系统</span>
        </div>
        <Link
          href="/brand-builder/calendar"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
        >
          查看日历 <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
