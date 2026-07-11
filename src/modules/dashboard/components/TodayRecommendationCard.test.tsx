import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => createElement('span', null, children),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: { children: ReactNode }) => createElement('button', props, children),
}));

vi.mock('lucide-react', () => ({
  ChevronDown: () => createElement('svg'),
  Sparkles: () => createElement('svg'),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: null, isLoading: false, isError: false }),
}));

import {
  TodayRecommendationCardView,
  type TodayRecommendation,
} from './TodayRecommendationCard';

describe('TodayRecommendationCardView', () => {
  it('renders no markup while loading', () => {
    const html = renderToStaticMarkup(
      createElement(TodayRecommendationCardView, {
        recommendation: engineRecommendation(),
        isLoading: true,
        expanded: false,
        onToggle: vi.fn(),
        onNavigate: vi.fn(),
      }),
    );

    expect(html).toBe('');
  });

  it('renders no markup when recommendation is null', () => {
    const html = renderToStaticMarkup(
      createElement(TodayRecommendationCardView, {
        recommendation: null,
        expanded: false,
        onToggle: vi.fn(),
        onNavigate: vi.fn(),
      }),
    );

    expect(html).toBe('');
  });

  it('renders engine recommendations with friendly source metadata', () => {
    const html = renderToStaticMarkup(
      createElement(TodayRecommendationCardView, {
        recommendation: engineRecommendation(),
        expanded: false,
        onToggle: vi.fn(),
        onNavigate: vi.fn(),
      }),
    );

    expect(html).toContain('Today&#x27;s Recommendation');
    expect(html).toContain('Convert the next qualified lead');
    expect(html).toContain('AI 分析');
    expect(html).toContain('84% confidence');
    expect(html).not.toContain('Mission and revenue signals agree.');
  });

  it('renders rule recommendations with beginner guidance metadata', () => {
    const html = renderToStaticMarkup(
      createElement(TodayRecommendationCardView, {
        recommendation: ruleRecommendation(),
        expanded: false,
        onToggle: vi.fn(),
        onNavigate: vi.fn(),
      }),
    );

    expect(html).toContain('Complete the AI Interview');
    expect(html).toContain('新手引导');
    expect(html).toContain('90% confidence');
  });

  it('renders rationale when expanded', () => {
    const html = renderToStaticMarkup(
      createElement(TodayRecommendationCardView, {
        recommendation: engineRecommendation(),
        expanded: true,
        onToggle: vi.fn(),
        onNavigate: vi.fn(),
      }),
    );

    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('Mission and revenue signals agree.');
  });
});

function engineRecommendation(): TodayRecommendation {
  return {
    recommendation: {
      id: 'engine-1',
      title: 'Convert the next qualified lead',
      summary: 'Focus today on the highest-impact sales action.',
      rationale: 'Mission and revenue signals agree.',
      route: '/sales',
      ctaLabel: 'Open Sales',
    },
    confidence: 0.84,
    explain: 'Mission and revenue signals agree.',
    source: 'engine',
  };
}

function ruleRecommendation(): TodayRecommendation {
  return {
    recommendation: {
      id: 'rule-1',
      title: 'Complete the AI Interview',
      summary: 'Finish the AI Interview before deeper recommendations.',
      rationale: 'Business State still lacks the core interview signal.',
      route: '/brand-builder/step/interview',
      ctaLabel: 'Start AI Interview',
    },
    confidence: 0.9,
    explain: 'Business State still lacks the core interview signal.',
    source: 'rule',
  };
}
