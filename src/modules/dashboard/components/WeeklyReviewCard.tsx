'use client';

import { createElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/Spinner';
import type { WeeklyReviewResult } from '../services/weekly-review-service';

const h = createElement;

async function fetchWeeklyReview() {
  const response = await fetch('/api/v1/dashboard/weekly-review');
  if (!response.ok) throw new Error('Failed to load weekly review');

  const json = await response.json() as { data: WeeklyReviewResult | null };
  return json.data;
}

export function WeeklyReviewCard() {
  const t = useTranslations('dashboard.weeklyReview');
  const review = useQuery({
    queryKey: ['dashboard-weekly-review'],
    queryFn: fetchWeeklyReview,
    staleTime: 60_000,
    retry: false,
  });

  if (review.isLoading) {
    return h(
      'section',
      {
        'aria-label': t('title'),
        className: 'flex min-h-24 items-center justify-center rounded-lg border border-border bg-white p-5 shadow-sm',
      },
      h(Spinner, { size: 'sm', className: 'text-muted' }),
    );
  }

  if (!review.data) return null;

  const summary = review.data.hasActivity
    ? h(
      'div',
      null,
      h(
        'dl',
        { className: 'mt-4 grid gap-3 border-y border-border py-4 sm:grid-cols-2' },
        h(
          'div',
          { className: 'flex items-baseline justify-between gap-3' },
          h('dt', { className: 'text-sm text-muted' }, t('completedMissions')),
          h(
            'dd',
            { className: 'text-sm font-semibold tabular-nums text-foreground' },
            review.data.completedMissions,
          ),
        ),
        h(
          'div',
          { className: 'flex items-baseline justify-between gap-3' },
          h('dt', { className: 'text-sm text-muted' }, t('recommendations')),
          h(
            'dd',
            { className: 'text-sm font-semibold tabular-nums text-foreground' },
            `${review.data.recommendationsIssued} / ${review.data.recommendationsAccepted} / ${review.data.recommendationsIgnored}`,
          ),
        ),
      ),
      h('p', { className: 'mt-2 text-xs text-muted' }, t('recommendationBreakdown')),
      h(
        'ul',
        { className: 'mt-4 space-y-3', 'aria-label': t('activities') },
        review.data.activities.map((activity, index) => h(
          'li',
          {
            key: `${activity.type}:${activity.referenceId ?? activity.occurredAt}:${index}`,
            className: 'border-l-2 border-primary/30 pl-3',
          },
          h(
            'div',
            { className: 'flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3' },
            h('p', { className: 'text-sm font-medium text-foreground' }, activity.title),
            h(
              'time',
              { className: 'text-xs text-muted', dateTime: activity.occurredAt },
              activity.occurredAt.slice(0, 10),
            ),
          ),
          activity.summary
            ? h('p', { className: 'mt-1 text-sm leading-relaxed text-muted' }, activity.summary)
            : null,
        )),
      ),
    )
    : h('p', { className: 'mt-4 text-sm text-muted' }, t('emptyState', { days: review.data.windowDays }));

  return h(
    'section',
    {
      'aria-label': t('title'),
      className: 'rounded-lg border border-border bg-white p-5 shadow-sm',
      'data-testid': 'weekly-review-card',
    },
    h(
      'div',
      null,
      h('p', { className: 'text-xs font-semibold uppercase tracking-wide text-primary' }, t('title')),
      h(
        'p',
        { className: 'mt-1 text-sm leading-relaxed text-muted' },
        t('description', { days: review.data.windowDays }),
      ),
    ),
    summary,
  );
}
