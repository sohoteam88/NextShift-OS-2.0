'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/cn';
import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';
import type { FunnelProgress, FunnelHealth, FunnelNextAction, FunnelMilestone } from '../../types/funnel-os';
import { MILESTONES, FUNNEL_GOALS } from '../../types/funnel-os';
import { useFunnelOS } from '../../hooks/use-funnel-os';

type Props = { funnelType: BusinessFunnelType; locale?: 'zh' | 'en' | 'ms'; className?: string };

const LABELS: Record<BusinessFunnelType, Record<string, string>> = {
  retail: { zh: '零售漏斗', en: 'Retail Funnel', ms: 'Funnel Runcit' },
  recruitment: { zh: '招募漏斗', en: 'Recruitment Funnel', ms: 'Funnel Perekrutan' },
  upgrade: { zh: '升级漏斗', en: 'Upgrade Funnel', ms: 'Funnel Naik Taraf' },
};

function normalizeLocale(locale: string): 'zh' | 'en' | 'ms' {
  if (locale.startsWith('en')) return 'en';
  if (locale.startsWith('ms')) return 'ms';
  return 'zh';
}

export function FunnelOperatingCard({ funnelType, locale, className }: Props) {
  const currentLocale = useLocale();
  const activeLocale = normalizeLocale(locale ?? currentLocale);
  const q = useFunnelOS(funnelType);
  const d = q.data?.data; const p = d?.progress; const h = d?.health; const n = d?.nextAction;
  const label = LABELS[funnelType]?.[activeLocale] ?? funnelType;

  return (
    <section className={cn('rounded-xl border border-[var(--color-border)] bg-white p-5 shadow-sm', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">{label}</h3>
        {h && (
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
            h.overallScore >= 70 ? 'bg-emerald-100 text-emerald-700' :
            h.overallScore >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>
            {h.overallScore}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {p && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">{p.currentStage}</span>
            <span className="font-bold">{p.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${p.progress}%` }} />
          </div>
        </div>
      )}

      {/* Bottleneck */}
      {p?.bottleneck && (
        <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-200 text-xs">
          <span className="font-bold text-red-700">瓶颈: {p.bottleneck}</span>
          <span className="text-red-600 ml-1">→ {p.bottleneckFix}</span>
        </div>
      )}

      {/* Next Action */}
      {n && (
        <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-xs">
          <span className="font-bold text-blue-700">Next: {n.action}</span>
          <span className="text-blue-600 ml-1">· {n.expectedImpact}</span>
        </div>
      )}

      {/* Milestones */}
      {d?.milestones && (
        <div className="mt-3 flex flex-wrap gap-1">
          {d.milestones.map(m => (
            <span key={m.id} className={cn('text-xs px-2 py-0.5 rounded-full border', m.completed ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-gray-50 border-gray-200 text-gray-400')}>
              {m.completed ? '✓' : '○'} {m.label}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
