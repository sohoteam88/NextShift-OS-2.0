'use client';

import { createElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
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

export function BusinessScoreCard() {
  const t = useTranslations('dashboard.businessScore');
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
        'aria-label': t('title'),
        className: 'flex min-h-24 items-center justify-center rounded-lg border border-border bg-white p-5 shadow-sm',
      },
      h(Spinner, { size: 'sm', className: 'text-muted' }),
    );
  }

  if (!score.data) return null;

  return h(
    'section',
    {
      'aria-label': t('title'),
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
          t('title'),
        ),
        h(
          'p',
          { className: 'mt-1 text-sm leading-relaxed text-muted' },
          t('description'),
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
        h(Badge, { variant: bandVariant(score.data.scoreBand) }, t(`band.${score.data.scoreBand}`)),
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
        h(
          'dt',
          { className: 'text-sm text-muted' },
          factor.source === 'analytics.projection.readiness.value'
            ? t('factor.readiness')
            : t('factor.forecastConfidence'),
        ),
        h(
          'dd',
          { className: 'text-sm font-semibold tabular-nums text-foreground' },
          factor.value,
        ),
      )),
    ),
  );
}
