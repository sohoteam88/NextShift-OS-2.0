'use client';

import * as React from 'react';
import { CheckCircle2, AlertTriangle, TrendingUp, ShieldCheck, Target, Lightbulb, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { BrandConfidenceResult, ConfidenceDimension } from '../brandConfidenceEngine';

// ============================================================
// Types
// ============================================================

type Locale = 'zh' | 'en' | 'ms';

interface ConfidenceCardProps {
  result: BrandConfidenceResult;
  locale?: Locale;
  className?: string;
}

// ============================================================
// Dimension icons
// ============================================================

const DIMENSION_ICONS: Record<ConfidenceDimension, React.ComponentType<{ className?: string }>> = {
  audience_clarity: Target,
  story_clarity: Lightbulb,
  offer_clarity: Sparkles,
  market_positioning: TrendingUp,
  content_direction: Lightbulb,
  personal_credibility: ShieldCheck,
};

// ============================================================
// Score bar color
// ============================================================

function scoreColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-400';
}

function scoreBgColor(score: number): string {
  if (score >= 70) return 'bg-emerald-50 border-emerald-200';
  if (score >= 40) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

function overallLevelColor(level: string): string {
  switch (level) {
    case 'high':
      return 'text-emerald-700 bg-emerald-100';
    case 'medium':
      return 'text-amber-700 bg-amber-100';
    default:
      return 'text-red-700 bg-red-100';
  }
}

// ============================================================
// Component
// ============================================================

export function ConfidenceCard({ result, locale = 'zh', className }: ConfidenceCardProps) {
  const title =
    locale === 'en'
      ? 'Brand Readiness'
      : locale === 'ms'
        ? 'Kesiapsiagaan Jenama'
        : '品牌就绪度';

  const readyLabel =
    locale === 'en'
      ? 'Ready for Brand DNA'
      : locale === 'ms'
        ? 'Sedia untuk DNA Jenama'
        : '可以生成 Brand DNA';

  const notReadyLabel =
    locale === 'en'
      ? 'Keep chatting to improve'
      : locale === 'ms'
        ? 'Terus bersembang untuk tingkatkan'
        : '继续聊天提升分数';

  const levelLabels: Record<string, Record<Locale, string>> = {
    high: { zh: '高', en: 'High', ms: 'Tinggi' },
    medium: { zh: '中', en: 'Medium', ms: 'Sederhana' },
    low: { zh: '低', en: 'Low', ms: 'Rendah' },
  };

  return (
    <section className={cn('rounded-xl border bg-white p-4 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--color-text)]">{title}</h3>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold',
              overallLevelColor(result.level),
            )}
          >
            {result.overallScore}% · {levelLabels[result.level]?.[locale] ?? result.level}
          </span>
        </div>
      </div>

      {/* Overall score bar */}
      <div className="mb-4">
        <div className="h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn('h-full rounded-full transition-all duration-700 ease-out', scoreColor(result.overallScore))}
            style={{ width: `${Math.max(2, result.overallScore)}%` }}
          />
        </div>
      </div>

      {/* Ready indicator */}
      <div
        className={cn(
          'mb-4 rounded-lg border px-3 py-2 text-xs font-medium text-center',
          result.readyForDNA
            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
            : 'bg-amber-50 border-amber-200 text-amber-700',
        )}
      >
        {result.readyForDNA ? (
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {readyLabel}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            {notReadyLabel}
          </span>
        )}
      </div>

      {/* 6 dimensions */}
      <div className="space-y-2.5">
        {result.dimensions.map((dim) => {
          const Icon = DIMENSION_ICONS[dim.dimension] ?? Lightbulb;
          return (
            <div key={dim.dimension} className="flex items-center gap-2.5">
              <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-medium text-[var(--color-text)] truncate">
                    {dim.label}
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                    {dim.score}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', scoreColor(dim.score))}
                    style={{ width: `${Math.max(3, dim.score)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">
            {locale === 'en' ? 'Tips' : locale === 'ms' ? 'Tip' : '建议'}
          </p>
          {result.recommendations.map((rec, i) => (
            <p key={i} className="text-xs text-[var(--color-text-muted)] leading-relaxed mt-1">
              💡 {rec}
            </p>
          ))}
        </div>
      )}
    </section>
  );
}
