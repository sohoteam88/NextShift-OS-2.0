import { createElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BusinessScorePayload } from '@nextshift/contracts';

const queryState = vi.hoisted(() => ({
  result: {
    data: null as BusinessScorePayload | null,
    isLoading: false,
    isError: false,
  },
}));

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => createElement('span', null, children),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => queryState.result,
}));

import { BusinessScoreCard, BusinessScoreCardView } from './BusinessScoreCard';

afterEach(() => {
  queryState.result = { data: null, isLoading: false, isError: false };
});

describe('BusinessScoreCardView', () => {
  it('renders the score, bilingual band, factors, and explanation', () => {
    const html = renderToStaticMarkup(
      createElement(BusinessScoreCardView, { score: score() }),
    );

    expect(html).toContain('68');
    expect(html).toContain('就绪 / Ready');
    expect(html).toContain('Business state: SALES');
    expect(html).toContain('Readiness and growth signal are combined.');
  });

  it('renders no markup when the score data is null', () => {
    const html = renderToStaticMarkup(
      createElement(BusinessScoreCardView, { score: null }),
    );

    expect(html).toBe('');
  });
});

describe('BusinessScoreCard', () => {
  it('renders no markup on query error', () => {
    queryState.result = { data: score(), isLoading: false, isError: true };

    const html = renderToStaticMarkup(createElement(BusinessScoreCard));

    expect(html).toBe('');
  });
});

function score(): BusinessScorePayload {
  return {
    scoreId: 'command-center-tenant_1:score:business',
    scoreValue: 68,
    scoreBand: 'ready',
    factors: ['业务状态 / Business state: SALES'],
    confidence: 0.65,
    explanation: 'Readiness and growth signal are combined.',
    healthReference: 'SALES:NO_CONVERSION',
    growthReference: 'analytics-growth:medium',
  };
}
