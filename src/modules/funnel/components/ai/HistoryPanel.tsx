'use client';

import Link from 'next/link';
import { ArrowRight, History, BadgeCheck, ClipboardList, CheckCheck, Loader2 } from 'lucide-react';
import type { SavedFunnelRow } from '../../types/funnel-builder';
import { OUTPUT_ITEMS, STRATEGY_STEPS } from '../../constants/funnel-builder';

export function HistoryPanel({
  savedFunnels,
  isLoading,
  onRestore,
}: {
  savedFunnels: SavedFunnelRow[] | undefined;
  isLoading: boolean;
  onRestore: (item: SavedFunnelRow) => void;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">最近生成</h2>
      </div>
      <div className="mt-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            读取记录中...
          </div>
        ) : null}
        {(savedFunnels ?? []).slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <button
              type="button"
              onClick={() => onRestore(item)}
              className="block w-full text-left"
            >
              <p className="line-clamp-2 text-sm font-medium text-[var(--color-text)]">{item.title}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {new Date(item.config.ai_generated?.generated_at ?? item.createdAt).toLocaleString()}
              </p>
            </button>
            <Link
              href={`/funnel/${item.id}/edit`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
            >
              前往编辑
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        ))}
        {!isLoading && (savedFunnels ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">还没有记录。生成一次后会自动保存。</p>
        ) : null}
      </div>
    </div>
  );
}

export function OutputPanel() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <BadgeCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">输出内容</h2>
      </div>
      <div className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
        {OUTPUT_ITEMS.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <CheckCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StrategyPanel() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
        <h2 className="text-base font-semibold text-[var(--color-text)]">生成策略</h2>
      </div>
      <div className="mt-4 space-y-3">
        {STRATEGY_STEPS.map(([step, label]) => (
          <div key={step} className="flex gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-[var(--color-primary)]">{step}</span>
            <p className="text-sm text-[var(--color-text)]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
