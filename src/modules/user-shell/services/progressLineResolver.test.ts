import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getProgressLine, resolvePublishingProgress } from './progressLineResolver';

const NOW = new Date('2026-07-31T12:00:00.000Z');
const businessUser = {
  businessStartAt: new Date('2026-07-30T12:00:00.000Z'),
  createdAt: new Date('2026-07-01T12:00:00.000Z'),
};

describe('progressLineResolver', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the experience progress line for a user still in the trial phase', () => {
    expect(getProgressLine({
      user: { businessStartAt: null, createdAt: new Date('2026-07-29T12:00:00.000Z') },
      confirmedPublishedCount: 0,
      generatedCount: 0,
      todayAction: '',
    })).toBe('体验第 3 天 · 今天的奶昔喝了吗？');
  });

  it('reports confirmed publishing as 已发', () => {
    expect(resolvePublishingProgress({
      confirmedPublishedCount: 2,
      generatedCount: 3,
    })).toEqual({ status: 'published', count: 2 });

    expect(getProgressLine({
      user: businessUser,
      confirmedPublishedCount: 2,
      generatedCount: 3,
      todayAction: '发一条近况',
    })).toBe('第 2 天 · 已发 2 条 · 今天做 发一条近况');
  });

  it('reports generated but unconfirmed content as 已准备', () => {
    expect(resolvePublishingProgress({
      confirmedPublishedCount: 0,
      generatedCount: 3,
    })).toEqual({ status: 'prepared', count: 3 });

    expect(getProgressLine({
      user: businessUser,
      confirmedPublishedCount: 0,
      generatedCount: 3,
      todayAction: '确认并发布',
    })).toBe('第 2 天 · 已准备 3 条 · 今天做 确认并发布');
  });

  it('does not render a business progress line without generated or confirmed records', () => {
    expect(resolvePublishingProgress({
      confirmedPublishedCount: 0,
      generatedCount: 0,
    })).toBeNull();

    expect(getProgressLine({
      user: businessUser,
      confirmedPublishedCount: 0,
      generatedCount: 0,
      todayAction: '准备第一条内容',
    })).toBeNull();
  });
});
