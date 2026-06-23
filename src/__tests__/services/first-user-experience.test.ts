import { describe, expect, it } from 'vitest';
import type { ActivationProjection } from '@/modules/activation/contracts/ActivationProjection';
import type { DashboardProjection } from '@/modules/dashboard/adapters/DashboardProjectionAdapter';
import type { MissionExecutionWorkspace } from '@/modules/mission-workspace/services/MissionExecutionWorkspaceService';
import {
  buildFirstUserExperienceForDashboard,
  buildFirstUserExperienceForWorkspace,
} from '@/modules/product-experience/services/FirstUserExperienceService';

function activation(overrides: Partial<ActivationProjection> = {}): ActivationProjection {
  return {
    source: 'ActivationEngine',
    scope: 'user',
    confidence: 'fallback',
    fallback: 'new_user_no_activation_signal',
    generatedAt: '2026-06-22T00:00:00.000Z',
    activationScore: 10,
    activationThreshold: 100,
    activationRisk: 'medium',
    dropOffStage: 'none',
    activationState: {
      currentStep: 'SIGNUP',
      state: 'ON_TRACK',
      completionPercentage: 14,
      activated: false,
      hoursRemaining: 6,
      hoursSinceActivity: 0,
    },
    dropOffRisk: {
      state: 'ON_TRACK',
      riskLevel: 'low',
      currentStep: 'SIGNUP',
      gracePeriodHours: 6,
      hoursSinceActivity: 0,
      hoursRemaining: 6,
      activityAnchor: '2026-06-22T00:00:00.000Z',
      thresholdPercentUsed: 0,
      interventionAllowed: false,
    },
    localization: {
      locale: 'en',
      localeSource: 'systemDefault',
      translationSource: 'registry',
      fallbackUsed: true,
      messageKeys: [
        'activation.state.onTrack',
        'activation.funnel.signup',
        'activation.firstValue.none',
      ],
      stateLabel: 'On track',
      currentStepLabel: 'Sign up',
      nextActionLabel: 'Start interview',
      firstValueLabel: 'No first value yet',
      recoveryMessage: 'Your progress has paused for a while. Continue the current step to resume progress.',
      aiCooRiskTitle: 'Activation at risk',
      aiCooRiskReason: 'Activation state is On track. Current step: Sign up. Hours remaining: 6.',
    },
    activationFunnel: [
      { id: 'SIGNUP', label: 'Signup', status: 'completed', completedAt: '2026-06-22T00:00:00.000Z', successSignal: 'Account created' },
      { id: 'AI_INTERVIEW', label: 'AI Interview', status: 'current', completedAt: null, successSignal: 'Interview completed' },
      { id: 'BUSINESS_ANALYSIS', label: 'Business Analysis', status: 'locked', completedAt: null, successSignal: 'Business State generated' },
      { id: 'FIRST_MISSION', label: 'First Mission', status: 'locked', completedAt: null, successSignal: 'Mission started' },
      { id: 'FIRST_ASSET', label: 'First Asset', status: 'locked', completedAt: null, successSignal: 'Asset generated' },
      { id: 'FIRST_OUTCOME', label: 'First Outcome', status: 'locked', completedAt: null, successSignal: 'Outcome verified' },
      { id: 'ACTIVATED', label: 'Activated', status: 'locked', completedAt: null, successSignal: 'Value realized' },
    ],
    firstValue: {
      visible: false,
      type: 'none',
      label: 'No first value yet',
      achievedAt: null,
    },
    interventions: [],
    currentStep: {
      id: 'account_created',
      label: '账号已创建',
      route: '/dashboard',
      status: 'current',
      completedAt: null,
      estimatedMinutes: 0,
    },
    steps: [],
    firstWin: {
      achieved: false,
      targetMinutes: 10,
      targetAssetSeconds: 60,
      timeToFirstWinMinutes: null,
      progressPercent: 10,
      status: 'on_track',
    },
    currentMission: {
      title: 'Start interview',
      description: 'Answer questions.',
      route: '/brand-builder/step/interview',
      ctaLabel: 'Start interview',
      estimatedMinutes: 8,
    },
    shouldHideAdvancedModules: true,
    kpis: {
      activationRate: 0,
      interviewCompletionRate: 0,
      missionStartRate: 0,
      assetGenerationRate: 0,
      outcomeAchievementRate: 0,
      timeToFirstWinMinutes: null,
      sevenDayRetentionSignal: false,
      thirtyDayRetentionSignal: false,
    },
    ...overrides,
  };
}

const missionControl: DashboardProjection['missionControl'] = {
  locale: 'zh',
  source: 'ExplainabilityEngine',
  title: 'Create Your First Lead Magnet',
  objective: 'Create Your First Lead Magnet',
  description: 'Build a lead capture asset.',
  steps: [],
  currentStep: null,
  progress: 0,
  passedChecks: [],
  failedChecks: ['leadMagnet.exists'],
  remainingChecks: 1,
  nextRequiredCheck: 'leadMagnet.exists',
  verificationStatus: 'BLOCKED',
  successCriteria: ['Lead Magnet Exists'],
  completionChecks: ['leadMagnet.exists'],
  missionType: 'LEAD_MAGNET',
  currentGap: '还没有引流资源',
  completedItems: [],
  reasoning: 'Create a lead magnet.',
  decisionReason: 'Other work can wait.',
  whyThis: 'Create a lead magnet.',
  whyNow: 'Visitors need a reason to opt in.',
  whyNotOthers: 'Other work can wait.',
  whyItMatters: 'Capture qualified leads.',
  expectedOutcome: 'Lead magnet draft generated',
  expectedRisk: 'Visitors leave.',
  nextMilestone: 'Acquire First Lead',
  estimatedTime: '35 分钟',
  route: '/mission/mission-plan-lead_magnet',
  ctaLabel: 'Start mission',
  priority: 'High',
};

describe('PRODUCT-001 first user experience', () => {
  it('classifies a brand new user and points to a concrete next action', () => {
    const projection = buildFirstUserExperienceForDashboard({
      activation: activation(),
      missionControl,
    });

    expect(projection).toMatchObject({
      state: 'NEW',
      nextActionRoute: '/brand-builder/step/interview',
      firstValueMoment: {
        achieved: false,
        targetMinutes: 10,
        targetAssetSeconds: 60,
      },
      activationStatus: {
        stateLabel: 'On track',
      },
      emptyStateAction: {
        label: 'Start interview',
      },
    });
  });

  it('classifies generated draft assets as value realized in the workspace', () => {
    const workspace = {
      progress: { completionPercentage: 33, currentStep: { title: 'Generate Lead Magnet Content' } },
      businessOutcome: { completionPercentage: 25, name: 'Acquire First Lead' },
      generatedAssets: [
        {
          id: 'asset-1',
          title: 'Lead Magnet Draft',
          description: 'Draft',
          status: 'DRAFT',
          outputLevel: 'DRAFT_ASSET',
        },
      ],
      sourceRoute: '/lead-magnet',
      nextMilestone: 'Acquire First Lead',
      completion: { completed: false },
    } as MissionExecutionWorkspace;

    const projection = buildFirstUserExperienceForWorkspace({ workspace });

    expect(projection).toMatchObject({
      state: 'VALUE_REALIZED',
      progressPercent: 100,
      firstValueMoment: {
        achieved: true,
        label: 'Lead Magnet Draft',
      },
    });
  });
});
