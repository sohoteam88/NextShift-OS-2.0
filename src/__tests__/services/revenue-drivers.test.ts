import { describe, expect, it } from 'vitest';
import {
  REVENUE_DRIVERS,
  revenueDriverHubRouteForMission,
} from '@/modules/revenue-drivers/constants/revenue-drivers';
import { resolveRevenueDriverIntent } from '@/modules/revenue-drivers/constants/revenue-driver-intents';

describe('UX-002 revenue driver discovery', () => {
  it('keeps the revenue driver hierarchy visible and ordered', () => {
    expect(REVENUE_DRIVERS.map((driver) => driver.id)).toEqual([
      'whatsapp',
      'content',
      'video',
      'ads',
      'webinar',
      'leadMagnet',
      'funnels',
    ]);
  });

  it('routes AI COO mission types through the revenue driver hub', () => {
    expect(revenueDriverHubRouteForMission({ missionType: 'CONTENT' })).toBe('/revenue-drivers?driver=content');
    expect(revenueDriverHubRouteForMission({ missionType: 'TRAFFIC' })).toBe('/revenue-drivers?driver=ads');
    expect(revenueDriverHubRouteForMission({ missionType: 'WEBINAR' })).toBe('/revenue-drivers?driver=webinar');
    expect(revenueDriverHubRouteForMission({ missionType: 'CUSTOMERS' })).toBe('/revenue-drivers?driver=whatsapp');
    expect(revenueDriverHubRouteForMission({ route: '/lead-magnet' })).toBe('/revenue-drivers?driver=leadMagnet');
  });

  it('exposes webinar presentation and speaker script generator actions', () => {
    const webinar = REVENUE_DRIVERS.find((driver) => driver.id === 'webinar');

    expect(webinar?.actions.map((action) => action.id)).toEqual(
      expect.arrayContaining(['presentation-slides', 'speaker-script']),
    );
  });

  it.each([
    ['/content-engine', 'facebook-post', 'content.facebook-post'],
    ['/content-engine', 'tiktok-post', 'content.tiktok-post'],
    ['/traffic-engine', 'facebook-ad', 'ads.facebook-ad'],
    ['/webinar-center', 'presentation-slides', 'webinar.presentation-slides'],
    ['/webinar-center', 'speaker-script', 'webinar.speaker-script'],
    ['/video-production', 'veo-prompt', 'video.veo-prompt'],
    ['/whatsapp-ai', 'objection-handler', 'whatsapp.objection-handler'],
  ])('resolves %s?intent=%s to %s', (route, intent, toolId) => {
    expect(resolveRevenueDriverIntent({ route, intent })).toMatchObject({
      status: 'resolved',
      route,
      intent,
      toolId,
    });
  });

  it('falls back safely for invalid intents', () => {
    expect(resolveRevenueDriverIntent({
      route: '/webinar-center',
      intent: 'invalid-intent',
    })).toMatchObject({
      status: 'invalid',
      route: '/webinar-center',
      intent: 'invalid-intent',
    });
  });

  it('uses supported deep-link intents in revenue driver action hrefs', () => {
    const hrefs = REVENUE_DRIVERS.flatMap((driver) => driver.actions.map((action) => action.href));

    expect(hrefs).toEqual(expect.arrayContaining([
      '/content-engine?intent=facebook-post',
      '/content-engine?intent=tiktok-post',
      '/traffic-engine?intent=facebook-ad',
      '/webinar-center?intent=presentation-slides',
      '/webinar-center?intent=speaker-script',
      '/whatsapp-ai?intent=objection-handler',
    ]));

    for (const href of hrefs.filter((item) => item.includes('?intent='))) {
      const [route, query] = href.split('?');
      const intent = new URLSearchParams(query).get('intent');
      expect(resolveRevenueDriverIntent({ route, intent }).status).toBe('resolved');
    }
  });
});
