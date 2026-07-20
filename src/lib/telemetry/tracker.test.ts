import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  analytics,
  trackContentCopied,
  trackContentEditStarted,
  trackContentGenerated,
  trackContentLoopCompleted,
  trackContentDeleted,
  trackContentReopened,
  trackContentSaved,
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

  it('tracks content-loop events without content text or prompt properties', () => {
    const track = vi.spyOn(analytics, 'track').mockResolvedValue(undefined);
    const properties = {
      contentId: 'content-1',
      platform: 'instagram',
      contentType: 'text_post',
    };

    trackContentGenerated('user-1', properties);
    trackContentEditStarted('user-1', properties);
    trackContentSaved('user-1', properties);
    trackContentReopened('user-1', properties);
    trackContentCopied('user-1', properties);
    trackContentDeleted('user-1', properties);
    trackContentLoopCompleted('user-1', properties);

    expect(track).toHaveBeenNthCalledWith(1, 'content_generated', { ...properties, userId: 'user-1' });
    expect(track).toHaveBeenNthCalledWith(2, 'content_edit_started', { ...properties, userId: 'user-1' });
    expect(track).toHaveBeenNthCalledWith(3, 'content_saved', { ...properties, userId: 'user-1' });
    expect(track).toHaveBeenNthCalledWith(4, 'content_reopened', { ...properties, userId: 'user-1' });
    expect(track).toHaveBeenNthCalledWith(5, 'content_copied', { ...properties, userId: 'user-1' });
    expect(track).toHaveBeenNthCalledWith(6, 'content_deleted', { ...properties, userId: 'user-1' });
    expect(track).toHaveBeenNthCalledWith(7, 'content_loop_completed', { ...properties, userId: 'user-1' });
  });
});
