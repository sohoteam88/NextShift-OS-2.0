import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const queryMocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => queryMocks);
vi.mock('@/components/ui/Spinner', () => ({
  Spinner: ({ children }: { children?: ReactNode }) => createElement('span', null, children ?? 'Loading'),
}));

import { WeeklyReviewCard } from './WeeklyReviewCard';

afterEach(() => {
  vi.clearAllMocks();
});

describe('WeeklyReviewCard', () => {
  it('renders the activity, mission, and recommendation summary', () => {
    queryMocks.useQuery.mockReturnValue({
      isLoading: false,
      data: weeklyReview({
        activities: [{
          type: 'MISSION_COMPLETED',
          title: 'Finish brand profile',
          summary: 'Your positioning is ready.',
          occurredAt: '2026-07-13T12:00:00.000Z',
          referenceId: 'mission_1',
        }],
        completedMissions: 1,
        recommendationsIssued: 3,
        recommendationsAccepted: 2,
        recommendationsIgnored: 1,
        hasActivity: true,
      }),
    });

    const html = renderToStaticMarkup(createElement(WeeklyReviewCard));

    expect(html).toContain('weekly-review-card');
    expect(html).toContain('Finish brand profile');
    expect(html).toContain('Completed missions');
    expect(html).toContain('3 / 2 / 1');
  });

  it('renders no markup when the endpoint falls back to null', () => {
    queryMocks.useQuery.mockReturnValue({ data: null, isLoading: false });

    expect(renderToStaticMarkup(createElement(WeeklyReviewCard))).toBe('');
  });

  it('renders the honest empty-week state', () => {
    queryMocks.useQuery.mockReturnValue({
      isLoading: false,
      data: weeklyReview({ hasActivity: false }),
    });

    expect(renderToStaticMarkup(createElement(WeeklyReviewCard))).toContain('过去 7 天没有记录到活动');
  });
});

function weeklyReview(overrides: Record<string, unknown> = {}) {
  return {
    windowDays: 7,
    windowStart: '2026-07-07T12:00:00.000Z',
    windowEnd: '2026-07-14T12:00:00.000Z',
    activities: [],
    completedMissions: 0,
    recommendationsIssued: 0,
    recommendationsAccepted: 0,
    recommendationsIgnored: 0,
    discussionTurns: 0,
    executionPattern: {
      activityLevel: 'quiet' as const,
      completionVelocity: 'none' as const,
      recommendationResponse: 'unknown' as const,
      consistency: 'low' as const,
    },
    hasActivity: false,
    ...overrides,
  };
}
