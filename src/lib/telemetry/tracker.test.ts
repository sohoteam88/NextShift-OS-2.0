import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  analytics,
  trackDiscussionTurnSent,
  trackRecommendationClicked,
  trackRecommendationViewed,
  trackWeeklyActive,
} from './tracker';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('telemetry tracker events', () => {
  it('tracks recommendation views with source and confidence metadata', () => {
    const track = vi.spyOn(analytics, 'track').mockResolvedValue(undefined);

    trackRecommendationViewed('user-1', {
      recommendationId: 'rec-1',
      source: 'engine',
      confidence: 0.84,
    });

    expect(track).toHaveBeenCalledWith('recommendation_viewed', {
      userId: 'user-1',
      recommendationId: 'rec-1',
      source: 'engine',
      confidence: 0.84,
    });
  });

  it('tracks recommendation CTA clicks with the target route', () => {
    const track = vi.spyOn(analytics, 'track').mockResolvedValue(undefined);

    trackRecommendationClicked('user-1', {
      recommendationId: 'rec-1',
      ctaTarget: '/sales',
    });

    expect(track).toHaveBeenCalledWith('recommendation_clicked', {
      userId: 'user-1',
      recommendationId: 'rec-1',
      ctaTarget: '/sales',
    });
  });

  it('tracks discussion turns with recommendation and turn metadata', () => {
    const track = vi.spyOn(analytics, 'track').mockResolvedValue(undefined);

    trackDiscussionTurnSent('user-1', {
      recommendationId: 'rec-1',
      turnNumber: 2,
    });

    expect(track).toHaveBeenCalledWith('discussion_turn_sent', {
      userId: 'user-1',
      recommendationId: 'rec-1',
      turnNumber: 2,
    });
  });

  it('tracks weekly active users without extra payload requirements', () => {
    const track = vi.spyOn(analytics, 'track').mockResolvedValue(undefined);

    trackWeeklyActive('user-1', {});

    expect(track).toHaveBeenCalledWith('weekly_active', {
      userId: 'user-1',
    });
  });
});
