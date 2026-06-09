'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ContentStrategyStep } from './ContentStrategyStep';
import { ContentCalendarView } from './ContentCalendarView';

type Pillar = { name: string; emoji: string; pct: number };
type ContentStrategy = { tone: string; visual: string; frequency: string; format: string };
type CalendarItem = {
  id: string;
  date: string;
  pillar: string;
  pillarEmoji: string;
  title: string;
  hook: string | null;
  platform: string;
  format: string;
  status: string;
  contentId: string | null;
  notes: string | null;
};

type Props = {
  brandProfile: Record<string, unknown>;
  hasStrategy: boolean;
  initialItems: CalendarItem[];
};

export function CalendarPageClient({ brandProfile, hasStrategy: initialHasStrategy, initialItems }: Props) {
  const router = useRouter();
  const [hasStrategy, setHasStrategy] = React.useState(initialHasStrategy);

  function handleStrategyComplete(_: { contentPillars: Pillar[]; contentStrategy: ContentStrategy }) {
    setHasStrategy(true);
    router.refresh();
  }

  if (!hasStrategy) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">设置内容策略</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            定义你的内容支柱和风格，AI 将根据这些设置生成个性化日历
          </p>
        </div>
        <ContentStrategyStep brandProfile={brandProfile} onComplete={handleStrategyComplete} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">内容策略</h2>
          <button
            type="button"
            onClick={() => setHasStrategy(false)}
            className="text-xs text-[var(--color-primary)] hover:underline"
          >
            调整策略
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {((brandProfile.contentPillars as Array<{ name: string; emoji: string; pct: number }>) ?? []).map((p) => (
            <span
              key={p.name}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700"
            >
              {p.emoji} {p.name} {p.pct}%
            </span>
          ))}
        </div>
      </div>
      <ContentCalendarView initialItems={initialItems} hasProfile={!!brandProfile} />
    </div>
  );
}
