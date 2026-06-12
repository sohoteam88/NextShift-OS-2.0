'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowRight, Lock, Trophy } from 'lucide-react';
import {
  JOURNEY_MAP,
  getStageById,
  type JourneyCategory,
  type JourneyStage,
} from '../constants/journey-map';
import { cn } from '@/lib/cn';

export type JourneyStageWithStatus = JourneyStage & {
  status: 'completed' | 'active' | 'locked';
  completed_at?: string;
};

interface JourneyMapViewProps {
  stages: JourneyStageWithStatus[];
  progressPercent: number;
  totalXP: number;
}

const CATEGORY_META: Array<{ category: JourneyCategory; icon: string; label: string }> = [
  { category: 'brand', icon: '🎯', label: '品牌建设' },
  { category: 'social', icon: '📱', label: '社交设置' },
  { category: 'content', icon: '✍️', label: '内容引擎' },
  { category: 'acquisition', icon: '📣', label: '获客' },
  { category: 'conversion', icon: '💬', label: '转化' },
  { category: 'growth', icon: '🚀', label: '增长' },
];

function formatDate(date?: string) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getMonth() + 1}/${parsed.getDate()}`;
}

function getLockReason(stage: JourneyStage) {
  const prereq = stage.prerequisites.map((id) => getStageById(id)).find(Boolean);
  return prereq ? `需要先完成: ${prereq.name_zh}` : '需要先完成前置步骤';
}

function statusIcon(status: JourneyStageWithStatus['status']) {
  if (status === 'completed') return '✅';
  if (status === 'active') return '🔵';
  return '🔒';
}

function JourneyRow({ stage }: { stage: JourneyStageWithStatus }) {
  const date = formatDate(stage.completed_at);
  const locked = stage.status === 'locked';
  const row = (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-[var(--radius-lg)] border bg-white p-4 shadow-sm transition-colors',
        stage.status === 'active'
          ? 'border-blue-300 ring-2 ring-blue-100'
          : locked
            ? 'border-[var(--color-border)] opacity-65'
            : 'border-[var(--color-border)] hover:border-blue-200 hover:bg-blue-50',
      )}
      title={locked ? getLockReason(stage) : undefined}
    >
      <span className="text-lg leading-none">{statusIcon(stage.status)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--color-text)]">{stage.name_zh}</p>
          {stage.is_milestone ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              <Trophy className="h-3 w-3" aria-hidden="true" />
              里程碑
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{stage.description_zh}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs font-semibold text-blue-600">+{stage.xp_reward} XP</p>
        {stage.status === 'completed' ? (
          <p className="mt-1 text-xs text-green-600">{date ? `完成于 ${date}` : '已完成'}</p>
        ) : stage.status === 'active' ? (
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
            继续 <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </span>
        ) : (
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <Lock className="h-3 w-3" aria-hidden="true" />
            前置步骤
          </span>
        )}
      </div>
    </div>
  );

  if (locked) return row;
  return (
    <Link href={stage.route} className="block">
      {row}
    </Link>
  );
}

export function JourneyMapView({ stages, progressPercent, totalXP }: JourneyMapViewProps) {
  const grouped = useMemo(() => {
    const map = new Map<JourneyCategory, JourneyStageWithStatus[]>();
    for (const stage of stages) {
      if (stage.id === 'register' || stage.id === 'admin_approve') continue;
      const items = map.get(stage.category) ?? [];
      items.push(stage);
      map.set(stage.category, items);
    }
    return map;
  }, [stages]);

  const totalStages = JOURNEY_MAP.filter((stage) => stage.id !== 'admin_approve').length;

  return (
    <div className="space-y-6">
      <section className="sticky top-16 z-10 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white/95 p-5 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">总进度</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {progressPercent}% · 🏆 {totalXP} XP · {totalStages} 个阶段
            </p>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface)] sm:w-80">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </section>

      {CATEGORY_META.map(({ category, icon, label }) => {
        const items = grouped.get(category) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={category} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{icon}</span>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{label}</h2>
            </div>
            <div className="space-y-2">
              {items.map((stage) => (
                <JourneyRow key={stage.id} stage={stage} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
