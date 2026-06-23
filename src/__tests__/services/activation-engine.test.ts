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
    firstMissionStartedAt: null,
    firstAssetGeneratedAt: null,
    firstAssetReviewedAt: null,
    firstOutcomeVerifiedAt: null,
    lastActivityAt: signup,
    generatedAt: '2026-06-19T00:20:00.000Z',
    ...patch,
  };
}

describe('CUSTOMER-001 first user activation system', () => {
  it('keeps AI interview users on track inside the grace period', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: signup,
      generatedAt: '2026-06-19T05:00:00.000Z',
    }));

    expect(projection.activationScore).toBe(14);
    expect(projection.dropOffStage).toBe('none');
    expect(projection.dropOffRisk).toMatchObject({
      currentStep: 'AI_INTERVIEW',
      state: 'ON_TRACK',
      gracePeriodHours: 24,
      hoursRemaining: 19,
    });
    expect(projection.activationState).toMatchObject({
      currentStep: 'AI_INTERVIEW',
      state: 'ON_TRACK',
      activated: false,
    });
    expect(projection.activationFunnel.map((step) => step.id)).toEqual([
      'SIGNUP',
      'AI_INTERVIEW',
      'BUSINESS_ANALYSIS',
      'FIRST_MISSION',
      'FIRST_ASSET',
      'FIRST_OUTCOME',
      'ACTIVATED',
    ]);
    expect(projection.interventions).toEqual([]);
    expect(projection.shouldHideAdvancedModules).toBe(true);
  });

  it('marks AI interview users at risk after 75 percent of grace period', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: signup,
      generatedAt: '2026-06-19T20:00:00.000Z',
    }));

    expect(projection.dropOffStage).toBe('none');
    expect(projection.dropOffRisk).toMatchObject({
      currentStep: 'AI_INTERVIEW',
      state: 'AT_RISK',
      hoursRemaining: 4,
    });
    expect(projection.interventions[0]).toMatchObject({
      trigger: 'activation_stalled',
      action: 'in_app_prompt',
      message: 'You are still on track, with 4 hours left for this activation step.',
      messageKey: 'activation.intervention.atRisk',
      locale: 'en',
      translationSource: 'registry',
      fallbackUsed: false,
    });
  });

  it('localizes activation states, steps, and interventions into Chinese', () => {
    const projection = buildActivationProjection(
      facts({
        interviewStartedAt: signup,
        generatedAt: '2026-06-19T20:00:00.000Z',
      }),
      { userPreference: 'zh' },
    );

    expect(projection.localization).toMatchObject({
      locale: 'zh',
      localeSource: 'userPreference',
      stateLabel: '存在风险',
      currentStepLabel: '完成 AI 访谈',
      fallbackUsed: false,
    });
    expect(projection.activationFunnel[1]).toMatchObject({
      id: 'AI_INTERVIEW',
      label: '完成 AI 访谈',
      successSignal: '访谈已完成',
    });
    expect(projection.interventions[0]).toMatchObject({
      message: '你仍在进度内，这个激活步骤还剩 4 小时。',
      locale: 'zh',
      messageKey: 'activation.intervention.atRisk',
    });
  });

  it('localizes recovery interventions into Malay', () => {
    const projection = buildActivationProjection(
      facts({
        interviewStartedAt: signup,
        generatedAt: '2026-06-20T01:00:00.000Z',
      }),
      { userPreference: 'ms-MY' },
    );

    expect(projection.localization).toMatchObject({
      locale: 'ms',
      stateLabel: 'Tergendala',
      currentStepLabel: 'Lengkapkan Temu Bual AI',
    });
    expect(projection.interventions[0]).toMatchObject({
      message: 'Lengkapkan temu bual AI supaya kami boleh menjana misi pertama anda.',
      locale: 'ms',
      translationSource: 'registry',
      fallbackUsed: false,
    });
    expect(projection.localization.aiCooRiskTitle).toBe('Pengaktifan tergendala');
  });

  it('falls back to English without exposing raw localization keys', () => {
    const projection = buildActivationProjection(
      facts({
        interviewStartedAt: signup,
        generatedAt: '2026-06-19T20:00:00.000Z',
      }),
      { userPreference: 'ja-JP' },
    );

    expect(projection.localization).toMatchObject({
      locale: 'en',
      localeSource: 'systemDefault',
      fallbackUsed: true,
      stateLabel: 'At risk',
    });
    expect(projection.interventions[0].message).toBe('You are still on track, with 4 hours left for this activation step.');
    expect(projection.interventions[0].message).not.toContain('activation.intervention');
  });

  it('marks AI interview users dropped off only after the grace period is exceeded', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: signup,
      generatedAt: '2026-06-20T01:00:00.000Z',
    }));

    expect(projection.dropOffStage).toBe('interview_dropoff');
    expect(projection.dropOffRisk).toMatchObject({
      currentStep: 'AI_INTERVIEW',
      state: 'DROPPED_OFF',
      hoursRemaining: 0,
    });
    expect(projection.activationState).toMatchObject({
      state: 'DROPPED_OFF',
      blockedReason: 'interview_dropoff',
    });
  });

  it('keeps first mission users on track at exactly 75 percent of the grace period', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: signup,
      interviewCompletedAt: signup,
      brandDnaGeneratedAt: signup,
      generatedAt: '2026-06-20T12:00:00.000Z',
    }));

    expect(projection.dropOffStage).toBe('none');
    expect(projection.dropOffRisk).toMatchObject({
      currentStep: 'FIRST_MISSION',
      state: 'ON_TRACK',
      gracePeriodHours: 48,
      hoursRemaining: 12,
    });
  });

  it('marks first mission users dropped off after 48 hours without starting', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: signup,
      interviewCompletedAt: signup,
      brandDnaGeneratedAt: signup,
      generatedAt: '2026-06-21T02:00:00.000Z',
    }));

    expect(projection.dropOffStage).toBe('first_mission_dropoff');
    expect(projection.dropOffRisk).toMatchObject({
      currentStep: 'FIRST_MISSION',
      state: 'DROPPED_OFF',
      hoursRemaining: 0,
    });
  });

  it('resets the drop-off timer when meaningful activity occurs', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: signup,
      lastActivityAt: new Date('2026-06-19T23:00:00.000Z'),
      generatedAt: '2026-06-20T01:00:00.000Z',
    }));

    expect(projection.dropOffStage).toBe('none');
    expect(projection.dropOffRisk).toMatchObject({
      currentStep: 'AI_INTERVIEW',
      state: 'ON_TRACK',
      hoursSinceActivity: 2,
      hoursRemaining: 22,
    });
  });

  it('tracks time to first value when the first asset is generated without declaring drop-off', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: new Date('2026-06-19T00:02:00.000Z'),
      interviewCompletedAt: new Date('2026-06-19T00:08:00.000Z'),
      brandDnaGeneratedAt: new Date('2026-06-19T00:10:00.000Z'),
      firstMissionStartedAt: new Date('2026-06-19T00:10:30.000Z'),
      firstAssetGeneratedAt: new Date('2026-06-19T00:11:00.000Z'),
      generatedAt: '2026-06-19T00:11:00.000Z',
    }));

    expect(projection.activationScore).toBe(71);
    expect(projection.activationState).toMatchObject({
      currentStep: 'FIRST_OUTCOME',
      completionPercentage: 71,
      activated: false,
    });
    expect(projection.firstValue).toMatchObject({
      visible: true,
      type: 'first_asset',
      label: 'First asset generated',
      achievedAt: '2026-06-19T00:11:00.000Z',
    });
    expect(projection.firstWin).toMatchObject({
      achieved: true,
      timeToFirstWinMinutes: 11,
      progressPercent: 85,
      status: 'achieved',
    });
    expect(projection.dropOffStage).toBe('none');
    expect(projection.dropOffRisk.state).toBe('ON_TRACK');
    expect(projection.shouldHideAdvancedModules).toBe(true);
  });

  it('marks activation completed only after the first outcome is verified', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: new Date('2026-06-19T00:02:00.000Z'),
      interviewCompletedAt: new Date('2026-06-19T00:08:00.000Z'),
      brandDnaGeneratedAt: new Date('2026-06-19T00:10:00.000Z'),
      firstMissionStartedAt: new Date('2026-06-19T00:10:30.000Z'),
      firstAssetGeneratedAt: new Date('2026-06-19T00:11:00.000Z'),
      firstAssetReviewedAt: new Date('2026-06-19T00:12:00.000Z'),
      firstOutcomeVerifiedAt: new Date('2026-06-19T00:15:00.000Z'),
      firstLeadCapturedAt: new Date('2026-06-19T00:15:00.000Z'),
      generatedAt: '2026-06-19T00:15:00.000Z',
    }));

    expect(projection.activationScore).toBe(100);
    expect(projection.activationState).toMatchObject({
      currentStep: 'ACTIVATED',
      activated: true,
    });
    expect(projection.kpis).toMatchObject({
      activationRate: 100,
      missionStartRate: 100,
      assetGenerationRate: 100,
      outcomeAchievementRate: 100,
    });
    expect(projection.firstValue).toMatchObject({
      type: 'first_outcome',
      label: 'First outcome verified',
    });
    expect(projection.interventions).toEqual([]);
  });

  it('does not call first outcome unfinished a drop-off inside the seven-day window', () => {
    const projection = buildActivationProjection(facts({
      interviewStartedAt: new Date('2026-06-19T00:02:00.000Z'),
      interviewCompletedAt: new Date('2026-06-19T00:08:00.000Z'),
      brandDnaGeneratedAt: new Date('2026-06-19T00:10:00.000Z'),
      firstMissionStartedAt: new Date('2026-06-19T00:11:00.000Z'),
      firstContentGeneratedAt: new Date('2026-06-19T00:13:00.000Z'),
      firstAssetGeneratedAt: new Date('2026-06-19T00:18:00.000Z'),
      leadMagnetGeneratedAt: new Date('2026-06-19T00:18:00.000Z'),
      landingPagePublishedAt: new Date('2026-06-19T00:19:00.000Z'),
      generatedAt: '2026-06-21T00:19:00.000Z',
    }));

    expect(projection.dropOffStage).toBe('none');
    expect(projection.dropOffRisk).toMatchObject({
      currentStep: 'FIRST_OUTCOME',
      state: 'ON_TRACK',
    });
    expect(projection.currentStep).toMatchObject({
      id: 'first_lead_captured',
      status: 'current',
    });
  });
});
