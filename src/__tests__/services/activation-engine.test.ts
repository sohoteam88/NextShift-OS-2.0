import { describe, expect, it } from 'vitest';
import { buildActivationProjection } from '@/modules/activation/services/activation-projection';
import type { ActivationFacts } from '@/modules/activation/services/activation-score-engine';

const signup = new Date('2026-06-19T00:00:00.000Z');

function facts(patch: Partial<ActivationFacts> = {}): ActivationFacts {
  return {
    userCreatedAt: signup,
    interviewStartedAt: null,
    interviewCompletedAt: null,
    brandDnaGeneratedAt: null,
    firstContentGeneratedAt: null,
    firstLeadCapturedAt: null,
    leadMagnetGeneratedAt: null,
    landingPagePublishedAt: null,
    lastActivityAt: signup,
    generatedAt: '2026-06-19T00:20:00.000Z',
    ...patch,
  };
}

describe('CUSTOMER-001 first user activation system', () => {
  it('detects signup drop-off and critical first-win risk', () => {
    const projection = buildActivationProjection(facts());

    expect(projection.activationScore).toBe(10);
    expect(projection.dropOffStage).toBe('signup_dropoff');
    expect(projection.activationRisk).toBe('critical');
    expect(projection.firstWin).toMatchObject({
      achieved: false,
      targetMinutes: 15,
      status: 'missed',
    });
    expect(projection.shouldHideAdvancedModules).toBe(true);
  });

  it('tracks time to first win when first content is generated', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: new Date('2026-06-19T00:02:00.000Z'),
      interviewCompletedAt: new Date('2026-06-19T00:08:00.000Z'),
      brandDnaGeneratedAt: new Date('2026-06-19T00:10:00.000Z'),
      firstContentGeneratedAt: new Date('2026-06-19T00:13:00.000Z'),
      generatedAt: '2026-06-19T00:13:00.000Z',
    }));

    expect(projection.activationScore).toBe(90);
    expect(projection.firstWin).toMatchObject({
      achieved: true,
      timeToFirstWinMinutes: 13,
      progressPercent: 100,
      status: 'achieved',
    });
    expect(projection.dropOffStage).toBe('lead_magnet_dropoff');
    expect(projection.shouldHideAdvancedModules).toBe(false);
  });

  it('detects landing page drop-off after lead magnet but before first lead', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: new Date('2026-06-19T00:02:00.000Z'),
      interviewCompletedAt: new Date('2026-06-19T00:08:00.000Z'),
      brandDnaGeneratedAt: new Date('2026-06-19T00:10:00.000Z'),
      firstContentGeneratedAt: new Date('2026-06-19T00:13:00.000Z'),
      leadMagnetGeneratedAt: new Date('2026-06-19T00:18:00.000Z'),
      landingPagePublishedAt: new Date('2026-06-19T00:19:00.000Z'),
    }));

    expect(projection.dropOffStage).toBe('landing_page_dropoff');
    expect(projection.currentStep).toMatchObject({
      id: 'first_lead_captured',
      status: 'current',
    });
  });
});
