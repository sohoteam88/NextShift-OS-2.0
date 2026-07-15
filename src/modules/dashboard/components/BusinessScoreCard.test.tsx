import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const queryMocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => queryMocks);
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => createElement('span', null, children),
}));
vi.mock('@/components/ui/Spinner', () => ({
  Spinner: () => createElement('span', null, 'Loading'),
}));

import { BusinessScoreCard } from './BusinessScoreCard';

afterEach(() => {
  vi.clearAllMocks();
});

describe('BusinessScoreCard', () => {
  it('renders no markup when the score endpoint falls back to null', () => {
    queryMocks.useQuery.mockReturnValue({ data: null, isLoading: false });

    expect(renderToStaticMarkup(createElement(BusinessScoreCard))).toBe('');
  });

  it('renders the score, canonical band, and source factors without actions', () => {
    queryMocks.useQuery.mockReturnValue({
      isLoading: false,
      data: {
        scoreValue: 80,
        scoreBand: 'strong',
        factors: [
          { source: 'analytics.projection.readiness.value', value: 80 },
          { source: 'crm.revenueForecast.confidenceScore', value: 80 },
        ],
      },
    });

    const html = renderToStaticMarkup(createElement(BusinessScoreCard));

    expect(html).toContain('title');
    expect(html).toContain('band.strong');
    expect(html).toContain('factor.readiness');
    expect(html).toContain('factor.forecastConfidence');
    expect(html).not.toContain('<button');
  });
});
