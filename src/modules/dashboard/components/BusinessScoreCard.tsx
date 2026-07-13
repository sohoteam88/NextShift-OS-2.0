'use client';

import { createElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { BusinessScorePayload } from '@nextshift/contracts';
import { Badge } from '@/components/ui/Badge';

export type BusinessScoreCardViewProps = {
  score: BusinessScorePayload | null;
  isLoading?: boolean;
};

const h = createElement;

async function fetchBusinessScore() {
  const response = await fetch('/api/v1/dashboard/score');
  if (!response.ok) throw new Error('Failed to load business score');
  const json = await response.json() as { data: BusinessScorePayload | null };
  return json.data;
}

function bandPresentation(scoreBand: string) {
  if (scoreBand === 'strong') return { label: '强劲 / Strong', variant: 'success' as const };
  if (scoreBand === 'ready') return { label: '就绪 / Ready', variant: 'info' as const };
  return { label: '需要关注 / Needs attention', variant: 'warning' as const };
}

export function BusinessScoreCardView({
  score,
  isLoading = false,
}: BusinessScoreCardViewProps) {
  if (isLoading || !score) return null;

  const band = bandPresentation(score.scoreBand);

  return h(
    'section',
    {
      'aria-label': 'Business Score',
      className: 'rounded-lg border border-border bg-white p-5 shadow-sm',
      'data-testid': 'business-score-card',
    },
    h(
      'div',
      { className: 'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between' },
      h(
        'div',
        null,
        h(
          'p',
          { className: 'text-xs font-semibold uppercase tracking-wide text-primary' },
          '业务评分 / Business Score',
        ),
        h(
          'div',
          { className: 'mt-2 flex items-baseline gap-3' },
          h(
            'strong',
            { className: 'text-4xl font-semibold leading-none text-foreground' },
            score.scoreValue,
          ),
          h('span', { className: 'text-sm text-muted' }, '/ 100'),
        ),
      ),
      h(Badge, { variant: band.variant }, band.label),
    ),
    h('p', { className: 'mt-4 text-sm leading-relaxed text-muted' }, score.explanation),
    h(
      'ul',
      { className: 'mt-4 space-y-2 border-t border-border pt-4 text-sm text-foreground' },
      score.factors.map((factor) => h('li', { key: factor }, factor)),
    ),
  );
}

export function BusinessScoreCard() {
  const score = useQuery({
    queryKey: ['dashboard-business-score'],
    queryFn: fetchBusinessScore,
    staleTime: 60_000,
    retry: false,
  });

  if (score.isLoading || score.isError || !score.data) return null;

  return h(BusinessScoreCardView, { score: score.data });
}
