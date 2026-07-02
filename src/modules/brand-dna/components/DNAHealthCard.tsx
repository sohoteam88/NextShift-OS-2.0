'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Dna, TrendingUp, AlertTriangle } from 'lucide-react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/cn';

// ============================================================
// Types
// ============================================================

type Locale = 'zh' | 'en' | 'ms';

interface DNAHealthCardProps {
  locale?: Locale;
  className?: string;
}

function normalizeLocale(locale: string): Locale {
  if (locale.startsWith('en')) return 'en';
  if (locale.startsWith('ms')) return 'ms';
  return 'zh';
}

// ============================================================
// Hook
// ============================================================

function useDNAHealth() {
  return useQuery({
    queryKey: ['brand-dna', 'health'],
    queryFn: async () => {
      const res = await fetch('/api/v1/brand-dna/health');
      if (!res.ok) throw new Error('Failed to fetch DNA health');
      return res.json() as Promise<{
        data: {
          overallScore: number;
          isComplete: boolean;
          nextRecommendation: string | null;
          dimensions: {
            identityClarity: number;
            audienceClarity: number;
            messagingClarity: number;
            contentClarity: number;
            offerClarity: number;
            visualClarity: number;
          };
        };
      }>;
    },
    staleTime: 60_000,
  });
}

// ============================================================
// Component
// ============================================================

export function DNAHealthCard({ locale, className }: DNAHealthCardProps) {
  const currentLocale = useLocale();
  const activeLocale = normalizeLocale(locale ?? currentLocale);
  const query = useDNAHealth();
  const health = query.data?.data;

  const title = activeLocale === 'en' ? 'Brand DNA Health' : activeLocale === 'ms' ? 'Kesihatan DNA Jenama' : '品牌 DNA 健康度';
  const viewStudio = activeLocale === 'en' ? 'Open Studio' : activeLocale === 'ms' ? 'Buka Studio' : '进入 DNA Studio';
  const complete = activeLocale === 'en' ? 'Your Brand DNA is' : activeLocale === 'ms' ? 'DNA Jenama anda' : '你的 Brand DNA 完成度';

  if (query.isLoading) {
    return (
      <section className={cn('rounded-xl border border-[var(--color-border)] bg-white p-4 animate-pulse', className)}>
        <div className="h-4 w-32 rounded bg-gray-200 mb-3" />
        <div className="h-8 w-48 rounded bg-gray-100" />
      </section>
    );
  }

  if (!health) return null;

  const scoreColor =
    health.overallScore >= 80
      ? 'text-emerald-600'
      : health.overallScore >= 50
        ? 'text-amber-600'
        : 'text-red-500';

  const barColor =
    health.overallScore >= 80
      ? 'bg-emerald-500'
      : health.overallScore >= 50
        ? 'bg-amber-500'
        : 'bg-red-400';

  return (
    <section className={cn('rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm', className)}>
      <div className="flex items-center gap-2 mb-3">
        <Dna className="h-4 w-4 text-purple-600" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{title}</h3>
      </div>

      <div className="flex items-end justify-between mb-3">
        <div>
          <p className="text-sm text-[var(--color-text-muted)]">{complete}</p>
          <p className={cn('text-2xl font-bold', scoreColor)}>
            {health.overallScore}%
          </p>
        </div>
        {health.isComplete ? (
          <TrendingUp className="h-8 w-8 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-8 w-8 text-amber-400" />
        )}
      </div>

      {/* Mini bar */}
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 mb-3">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${Math.max(3, health.overallScore)}%` }}
        />
      </div>

      {/* Next step */}
      {health.nextRecommendation && (
        <p className="text-xs text-[var(--color-text-muted)] mb-3 leading-relaxed">
          💡 {health.nextRecommendation}
        </p>
      )}

      <Link
        href="/brand-builder/profile"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700"
      >
        {viewStudio} <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}
