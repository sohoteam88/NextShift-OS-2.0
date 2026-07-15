import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getWeeklyReview,
  type WeeklyReviewDependencies,
} from '@/modules/dashboard/services/weekly-review-service';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Weekly review service', () => {
  it('returns null and warns without loading memory when the user has no tenant', async () => {
    const loadWeeklyReview = vi.fn();
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await getWeeklyReview(
      { id: 'user_1', tenantId: null },
      { loadWeeklyReview },
    );

    expect(result).toBeNull();
    expect(loadWeeklyReview).not.toHaveBeenCalled();
    expect(warning).toHaveBeenCalledWith(
      '[weekly-review] unavailable without tenant context',
      { userId: 'user_1' },
    );
  });

  it('returns null and warns when the memory service rejects', async () => {
    const loadWeeklyReview = vi.fn().mockRejectedValueOnce(new Error('Memory unavailable'));
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await getWeeklyReview(user(), { loadWeeklyReview });

    expect(result).toBeNull();
    expect(warning).toHaveBeenCalledWith(
      '[weekly-review] unable to load weekly review',
      expect.objectContaining({ error: 'Memory unavailable' }),
    );
  });

  it('passes a successful memory projection through unchanged', async () => {
    const projection = weeklyReview();
    const loadWeeklyReview = vi.fn().mockResolvedValue(projection);

    const result = await getWeeklyReview(user(), { loadWeeklyReview } as WeeklyReviewDependencies);

    expect(loadWeeklyReview).toHaveBeenCalledWith('user_1', 'tenant_1');
    expect(result).toBe(projection);
  });
});

function user() {
  return { id: 'user_1', tenantId: 'tenant_1' };
}

function weeklyReview() {
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
  };
}
