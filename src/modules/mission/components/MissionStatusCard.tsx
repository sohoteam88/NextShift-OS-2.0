'use client';

import { Trophy } from 'lucide-react';
import type { JourneyCategory, JourneyStage } from '../constants/journey-map';
import { cn } from '@/lib/cn';

type Locale = 'zh' | 'en' | 'ms';

interface MissionStatusCardProps {
  currentStage: JourneyStage | null;
  progressPercent: number;
  totalXP: number;
  stageNumber: number;
  totalStages: number;
  locale?: Locale;
}

const CATEGORY_LABEL: Record<JourneyCategory, Record<Locale, string>> = {
  setup: { zh: '账号设置', en: 'Setup', ms: 'Persediaan' },
  brand: { zh: '品牌建设', en: 'Brand Building', ms: 'Bina Jenama' },
  social: { zh: '社交设置', en: 'Social Setup', ms: 'Media Sosial' },
  content: { zh: '内容引擎', en: 'Content Engine', ms: 'Kandungan' },
  acquisition: { zh: '获客系统', en: 'Acquisition', ms: 'Pemerolehan' },
  conversion: { zh: '转化系统', en: 'Conversion', ms: 'Penukaran' },
  growth: { zh: '增长模式', en: 'Growth Mode', ms: 'Mod Pertumbuhan' },
};

const CATEGORY_STYLE: Record<JourneyCategory, { pill: string; fill: string; ring: string }> = {
  setup: {
    pill: 'bg-slate-100 text-slate-700',
    fill: 'bg-slate-500',
    ring: 'ring-slate-100',
  },
  brand: {
    pill: 'bg-purple-100 text-purple-700',
    fill: 'bg-purple-500',
    ring: 'ring-purple-100',
  },
  social: {
    pill: 'bg-teal-100 text-teal-700',
    fill: 'bg-teal-500',
    ring: 'ring-teal-100',
  },
  content: {
    pill: 'bg-teal-100 text-teal-700',
    fill: 'bg-teal-500',
    ring: 'ring-teal-100',
  },
  acquisition: {
    pill: 'bg-blue-100 text-blue-700',
    fill: 'bg-blue-500',
    ring: 'ring-blue-100',
  },
  conversion: {
    pill: 'bg-blue-100 text-blue-700',
    fill: 'bg-blue-500',
    ring: 'ring-blue-100',
  },
  growth: {
    pill: 'bg-rose-100 text-rose-700',
    fill: 'bg-rose-500',
    ring: 'ring-rose-100',
  },
};

export function getCategoryLabel(category: JourneyCategory, locale: Locale = 'zh') {
  return CATEGORY_LABEL[category][locale] ?? CATEGORY_LABEL[category].zh;
}

export function MissionStatusCard({
  currentStage,
  progressPercent,
  totalXP,
  stageNumber,
  totalStages,
  locale = 'zh',
}: MissionStatusCardProps) {
  const category = currentStage?.category ?? 'setup';
  const style = CATEGORY_STYLE[category];

  return (
    <section className={cn('rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm ring-4', style.ring)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            {locale === 'en' ? 'Where you are now' : locale === 'ms' ? 'Di mana anda sekarang' : '你现在在哪里'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', style.pill)}>
              {getCategoryLabel(category, locale)}
            </span>
            <span className="text-sm font-medium text-[var(--color-text-muted)]">
              {locale === 'en' ? 'Stage' : locale === 'ms' ? 'Tahap' : '阶段'} {stageNumber}/{totalStages}
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
          <Trophy className="h-4 w-4" aria-hidden="true" />
          {totalXP} XP
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--color-surface)]">
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', style.fill)}
            style={{ width: `${Math.max(0, Math.min(progressPercent, 100))}%` }}
          />
        </div>
        <span className="w-12 text-right text-sm font-semibold text-[var(--color-text)]">{progressPercent}%</span>
      </div>
    </section>
  );
}
