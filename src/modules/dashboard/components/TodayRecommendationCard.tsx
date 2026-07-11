'use client';

import { createElement, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export type TodayRecommendation = {
  recommendation: {
    id: string;
    title: string;
    summary: string;
    rationale: string;
    route?: string;
    ctaLabel?: string;
  };
  confidence: number;
  explain: string;
  source: 'engine' | 'rule';
};

type TodayRecommendationCardViewProps = {
  recommendation: TodayRecommendation | null;
  isLoading?: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (route: string) => void;
};

const h = createElement;

async function fetchTodayRecommendation() {
  const response = await fetch('/api/v1/dashboard/recommendation');
  if (!response.ok) throw new Error('Failed to load today recommendation');
  const json = await response.json() as { data: TodayRecommendation | null };
  return json.data;
}

function sourceLabel(source: TodayRecommendation['source']) {
  return source === 'engine' ? 'AI 分析' : '新手引导';
}

function sourceVariant(source: TodayRecommendation['source']) {
  return source === 'engine' ? 'info' : 'success';
}

function confidenceLabel(confidence: number) {
  const normalized = Number.isFinite(confidence) ? confidence : 0;
  return `${Math.max(0, Math.min(100, Math.round(normalized * 100)))}% confidence`;
}

export function TodayRecommendationCardView({
  recommendation,
  isLoading = false,
  expanded,
  onToggle,
  onNavigate,
}: TodayRecommendationCardViewProps) {
  if (isLoading || !recommendation) return null;

  const route = recommendation.recommendation.route ?? '/dashboard';
  const ctaLabel = recommendation.recommendation.ctaLabel ?? 'Open recommendation';
  const explain = recommendation.explain || recommendation.recommendation.rationale;

  return h(
    'section',
    {
      'aria-label': 'Today\'s Recommendation',
      className: 'rounded-lg border border-border bg-white p-5 shadow-sm',
      'data-testid': 'today-recommendation-card',
    },
    h(
      'div',
      { className: 'flex flex-col gap-4 md:flex-row md:items-start md:justify-between' },
      h(
        'div',
        { className: 'min-w-0 space-y-3' },
        h(
          'div',
          { className: 'flex flex-wrap items-center gap-2' },
          h(
            'span',
            { className: 'inline-flex items-center gap-2 text-xs font-semibold uppercase text-primary' },
            h(Sparkles, { className: 'h-4 w-4', 'aria-hidden': true }),
            'Today\'s Recommendation',
          ),
          h(Badge, { variant: sourceVariant(recommendation.source) }, sourceLabel(recommendation.source)),
          h(Badge, { variant: 'default' }, confidenceLabel(recommendation.confidence)),
        ),
        h(
          'div',
          null,
          h(
            'h2',
            { className: 'text-xl font-semibold leading-tight text-foreground' },
            recommendation.recommendation.title,
          ),
          h(
            'p',
            { className: 'mt-2 text-sm leading-relaxed text-muted' },
            recommendation.recommendation.summary,
          ),
        ),
      ),
      h(
        Button,
        {
          type: 'button',
          onClick: () => onNavigate(route),
          size: 'sm',
          className: 'shrink-0',
        },
        ctaLabel,
      ),
    ),
    h(
      'div',
      { className: 'mt-4 border-t border-border pt-4' },
      h(
        'button',
        {
          type: 'button',
          className: 'inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-foreground',
          'aria-expanded': expanded,
          'aria-controls': 'today-recommendation-explain',
          onClick: onToggle,
        },
        'Why this recommendation',
        h(ChevronDown, {
          className: cn('h-4 w-4 transition-transform', expanded ? 'rotate-180' : ''),
          'aria-hidden': true,
        }),
      ),
      expanded
        ? h(
          'p',
          {
            id: 'today-recommendation-explain',
            className: 'mt-3 text-sm leading-relaxed text-muted',
          },
          explain,
        )
        : null,
    ),
  );
}

export function TodayRecommendationCard() {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const recommendation = useQuery({
    queryKey: ['dashboard-recommendation'],
    queryFn: fetchTodayRecommendation,
    staleTime: 60_000,
    retry: false,
  });

  if (recommendation.isError) return null;

  return h(TodayRecommendationCardView, {
    recommendation: recommendation.data ?? null,
    isLoading: recommendation.isLoading,
    expanded,
    onToggle: () => setExpanded((value) => !value),
    onNavigate: (route) => router.push(route),
  });
}
