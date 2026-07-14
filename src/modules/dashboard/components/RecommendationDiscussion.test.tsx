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
  MessageCircle: () => createElement('svg'),
  Send: () => createElement('svg'),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, number>) => {
    if (key === 'discussionTurns') return `第 ${values?.used}/${values?.limit} 轮`;
    if (key === 'discussionCharacterCount') return `${values?.count}/${values?.limit}`;
    return {
      discussWithAi: '和 AI 讨论',
      discussionEmpty: '当前还没有讨论内容。',
      discussionReplying: 'AI 正在回复',
      discussionInputPlaceholder: '输入你的问题',
      sendDiscussion: '发送',
      discussionQuotaExceeded: '今日 AI 额度已用完。',
      discussionTurnsExhausted: '本次讨论已达上限，试试执行推荐吧。',
      discussionConnectionFailed: '暂时无法连接 AI 讨论。',
      startMission: '开始任务',
    }[key] ?? key;
  },
}));

import { RecommendationDiscussion } from './RecommendationDiscussion';
import type { TodayRecommendation } from '../hooks/useDashboardRecommendation';
import {
  fetchDiscussionAvailability,
  sendDiscussionMessage,
} from '../hooks/useRecommendationDiscussion';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('RecommendationDiscussion', () => {
  it('keeps the discussion panel closed until the entry is selected', () => {
    const html = renderToStaticMarkup(createElement(RecommendationDiscussion, {
      recommendation: engineRecommendation(),
      open: false,
      messages: [],
      input: '',
      turnsUsed: 0,
      turnsLimit: 5,
      sending: false,
      error: null,
      onToggle: vi.fn(),
      onInputChange: vi.fn(),
      onSubmit: vi.fn(),
      onNavigate: vi.fn(),
    }));

    expect(html).toContain('和 AI 讨论');
    expect(html).not.toContain('data-testid="today-recommendation-discussion"');
  });

  it('renders messages, turn count, loading, validation, and errors when open', () => {
    const html = renderToStaticMarkup(createElement(RecommendationDiscussion, {
      recommendation: engineRecommendation(),
      open: true,
      messages: [
        { role: 'user', content: 'Why now?' },
        { role: 'assistant', content: 'Because the lead signal is strongest today.' },
      ],
      input: 'x'.repeat(1501),
      turnsUsed: 2,
      turnsLimit: 5,
      sending: true,
      error: { kind: 'turns' },
      onToggle: vi.fn(),
      onInputChange: vi.fn(),
      onSubmit: vi.fn(),
      onNavigate: vi.fn(),
    }));

    expect(html).toContain('data-testid="today-recommendation-discussion"');
    expect(html).toContain('第 2/5 轮');
    expect(html).toContain('Why now?');
    expect(html).toContain('Because the lead signal is strongest today.');
    expect(html).toContain('AI 正在回复');
    expect(html).toContain('1501/1500');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('本次讨论已达上限，试试执行推荐吧。');
    expect(html).toContain('Open Sales');
  });
});

describe('AI discussion API helpers', () => {
  it('returns availability data from the probe endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ data: { turnsLimit: 5 } }));
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

  it('preserves quota and turn-limit error kinds', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(response({ error: { code: 'QUOTA_EXCEEDED' } }, false, 429))
      .mockResolvedValueOnce(response({ error: { code: 'TURNS_EXHAUSTED' } }, false, 429)));

    await expect(sendDiscussionMessage('Again?', [])).rejects.toMatchObject({ kind: 'quota' });
    await expect(sendDiscussionMessage('Again?', [])).rejects.toMatchObject({ kind: 'turns' });
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

function response(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: async () => body,
  };
}
