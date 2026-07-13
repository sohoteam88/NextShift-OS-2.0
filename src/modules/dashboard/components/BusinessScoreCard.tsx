'use client';

import { createElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { BusinessScoreResult } from '../services/business-score-service';

const h = createElement;

async function fetchBusinessScore() {
  const response = await fetch('/api/v1/dashboard/score');
  if (!response.ok) throw new Error('Failed to load business score');

  const json = await response.json() as { data: BusinessScoreResult | null };
  return json.data;
}

function bandLabel(scoreBand: BusinessScoreResult['scoreBand']) {
  switch (scoreBand) {
    case 'strong':
      return 'Strong · 强劲';
    case 'ready':
      return 'Ready · 就绪';
    case 'needs_attention':
      return 'Needs attention · 需要关注';
  }
}

function bandVariant(scoreBand: BusinessScoreResult['scoreBand']) {
  switch (scoreBand) {
    case 'strong':
      return 'success' as const;
    case 'ready':
      return 'info' as const;
    case 'needs_attention':
      return 'warning' as const;
  }
}

function factorLabel(source: BusinessScoreResult['factors'][number]['source']) {
  return source === 'analytics.projection.readiness.value'
    ? 'Readiness · 准备度'
    : 'Forecast confidence · 预测信心';
}

export function BusinessScoreCard() {
  const score = useQuery({
    queryKey: ['dashboard-business-score'],
    queryFn: fetchBusinessScore,
    staleTime: 60_000,
    retry: false,
  });

  if (score.isLoading) {
    return h(
      'section',
      {
        'aria-label': 'Business Score',
        className: 'flex min-h-24 items-center justify-center rounded-lg border border-border bg-white p-5 shadow-sm',
      },
      h(Spinner, { size: 'sm', className: 'text-muted' }),
    );
  }

  if (!score.data) return null;

  return h(
    'section',
    {
      'aria-label': 'Business Score',
      className: 'rounded-lg border border-border bg-white p-5 shadow-sm',
      'data-testid': 'business-score-card',
    },
    h(
      'div',
      { className: 'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between' },
      h(
        'div',
        null,
        h(
          'p',
          { className: 'text-xs font-semibold uppercase tracking-wide text-primary' },
          'Business Score · 业务评分',
        ),
        h(
          'p',
          { className: 'mt-1 text-sm leading-relaxed text-muted' },
          'A read-only snapshot of readiness and current revenue forecast confidence.',
        ),
      ),
      h(
        'div',
        { className: 'flex items-center gap-3 sm:text-right' },
        h(
          'p',
          { className: 'text-4xl font-bold tabular-nums text-foreground' },
          score.data.scoreValue,
        ),
        h(Badge, { variant: bandVariant(score.data.scoreBand) }, bandLabel(score.data.scoreBand)),
      ),
    ),
    h(
      'dl',
      { className: 'mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2' },
      score.data.factors.map((factor) => h(
        'div',
        {
          key: factor.source,
          className: 'flex items-baseline justify-between gap-3',
        },
        h('dt', { className: 'text-sm text-muted' }, factorLabel(factor.source)),
        h(
          'dd',
          { className: 'text-sm font-semibold tabular-nums text-foreground' },
          factor.value,
        ),
      )),
    ),
  );
}
