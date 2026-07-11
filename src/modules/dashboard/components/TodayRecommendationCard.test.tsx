import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/components/ui/Badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => createElement('span', null, children),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, ...props }: { children: ReactNode }) => createElement('button', props, children),
}));

vi.mock('@/components/ui/Spinner', () => ({
  Spinner: () => createElement('span', null, 'Loading'),
}));

vi.mock('lucide-react', () => ({
  ChevronDown: () => createElement('svg'),
  MessageCircle: () => createElement('svg'),
  Send: () => createElement('svg'),
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
  fetchDiscussionAvailability,
  sendDiscussionMessage,
  type TodayRecommendation,
} from './TodayRecommendationCard';

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it('hides the AI discussion entry until availability is confirmed', () => {
    const html = renderToStaticMarkup(
      createElement(TodayRecommendationCardView, {
        recommendation: engineRecommendation(),
        expanded: false,
        onToggle: vi.fn(),
        onNavigate: vi.fn(),
        discussionAvailable: false,
      }),
    );

    expect(html).not.toContain('和 AI 讨论');
    expect(html).not.toContain('today-recommendation-discussion');
  });

  it('renders the AI discussion entry and round counter when available', () => {
    const html = renderToStaticMarkup(
      createElement(TodayRecommendationCardView, {
        recommendation: engineRecommendation(),
        expanded: false,
        onToggle: vi.fn(),
        onNavigate: vi.fn(),
        discussionAvailable: true,
        discussionOpen: true,
        discussionTurnsUsed: 2,
        discussionTurnsLimit: 5,
        discussionMessages: [
          { role: 'user', content: 'Why now?' },
          { role: 'assistant', content: 'Because the lead signal is strongest today.' },
        ],
        onDiscussionToggle: vi.fn(),
        onDiscussionInputChange: vi.fn(),
        onDiscussionSubmit: vi.fn(),
      }),
    );

    expect(html).toContain('和 AI 讨论');
    expect(html).toContain('第 2/5 轮');
    expect(html).toContain('Why now?');
    expect(html).toContain('Because the lead signal is strongest today.');
  });

  it('renders discussion loading and character validation states', () => {
    const html = renderToStaticMarkup(
      createElement(TodayRecommendationCardView, {
        recommendation: engineRecommendation(),
        expanded: false,
        onToggle: vi.fn(),
        onNavigate: vi.fn(),
        discussionAvailable: true,
        discussionOpen: true,
        discussionInput: 'x'.repeat(1501),
        discussionSending: true,
        onDiscussionToggle: vi.fn(),
        onDiscussionInputChange: vi.fn(),
        onDiscussionSubmit: vi.fn(),
      }),
    );

    expect(html).toContain('AI 正在回复');
    expect(html).toContain('1501/1500');
    expect(html).toContain('aria-invalid="true"');
  });

  it('renders quota and turn-limit discussion errors', () => {
    const quotaHtml = renderToStaticMarkup(
      createElement(TodayRecommendationCardView, {
        recommendation: engineRecommendation(),
        expanded: false,
        onToggle: vi.fn(),
        onNavigate: vi.fn(),
        discussionAvailable: true,
        discussionOpen: true,
        discussionError: { kind: 'quota', message: 'quota' },
        onDiscussionToggle: vi.fn(),
        onDiscussionInputChange: vi.fn(),
        onDiscussionSubmit: vi.fn(),
      }),
    );
    const turnsHtml = renderToStaticMarkup(
      createElement(TodayRecommendationCardView, {
        recommendation: engineRecommendation(),
        expanded: false,
        onToggle: vi.fn(),
        onNavigate: vi.fn(),
        discussionAvailable: true,
        discussionOpen: true,
        discussionError: { kind: 'turns', message: 'turns' },
        onDiscussionToggle: vi.fn(),
        onDiscussionInputChange: vi.fn(),
        onDiscussionSubmit: vi.fn(),
      }),
    );

    expect(quotaHtml).toContain('今日 AI 额度已用完');
    expect(turnsHtml).toContain('本次讨论已达上限,试试执行推荐吧');
    expect(turnsHtml).toContain('Open Sales');
  });
});

describe('AI discussion API helpers', () => {
  it('returns availability data from the probe endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      data: { turnsLimit: 5 },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchDiscussionAvailability()).resolves.toEqual({ turnsLimit: 5 });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/dashboard/recommendation/discuss');
  });

  it('returns null when the probe endpoint reports discussion disabled', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response({ data: null })));

    await expect(fetchDiscussionAvailability()).resolves.toBeNull();
  });

  it('sends discussion messages through the API contract', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({
      reply: 'Focus on the qualified lead first.',
      turnsUsed: 1,
      turnsLimit: 5,
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendDiscussionMessage('Why now?', [])).resolves.toEqual({
      reply: 'Focus on the qualified lead first.',
      turnsUsed: 1,
      turnsLimit: 5,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/dashboard/recommendation/discuss',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ message: 'Why now?', history: [] }),
      }),
    );
  });

  it('maps quota and turn-limit responses to friendly errors', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({ error: { code: 'QUOTA_EXCEEDED' } }, false, 429))
      .mockResolvedValueOnce(response({ error: { code: 'TURNS_EXHAUSTED' } }, false, 429)));

    await expect(sendDiscussionMessage('Again?', [])).rejects.toThrow('今日 AI 额度已用完');
    await expect(sendDiscussionMessage('Again?', [])).rejects.toThrow('本次讨论已达上限');
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

function response(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}
