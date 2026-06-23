import type {
  ActivationFunnelStep,
  ActivationFunnelStepId,
  ActivationIntervention,
  ActivationProjection,
  ActivationStep,
  ActivationStepId,
} from '../contracts/ActivationProjection';
import type { ProductLocale } from '@/modules/localization/services/LocalizationEngine';
import {
  calculateActivationScore,
  completedActivationFunnelSteps,
  completedActivationSteps,
  getActivationFunnelCurrentStep,
  type ActivationFacts,
} from './activation-score-engine';
import { detectDropOffStage, getActivationDropOffRisk } from './dropoff-detector';
import {
  FIRST_ASSET_TARGET_SECONDS,
  FIRST_WIN_TARGET_MINUTES,
  getFirstWinProgressPercent,
  getFirstWinStatus,
  getTimeToFirstWinMinutes,
} from './first-win-engine';
import {
  activationCurrentMissionCta,
  activationCurrentMissionDescription,
  activationFirstValueLabel,
  activationFunnelLabel,
  activationFunnelSuccessSignal,
  activationInterventionMessage,
  activationStepLabel,
  buildActivationLocalizedCopy,
  resolveActivationLocale,
  type ActivationLocalizationInput,
} from './activation-localization';

const ACTIVATION_THRESHOLD = 100;

const STEP_DEFINITIONS: Array<Omit<ActivationStep, 'status' | 'completedAt'>> = [
  { id: 'account_created', label: '账号已创建', route: '/dashboard', estimatedMinutes: 0 },
  { id: 'interview_started', label: '开始品牌访谈', route: '/brand-builder/step/interview', estimatedMinutes: 2 },
  { id: 'interview_completed', label: '完成品牌访谈', route: '/brand-builder/step/interview', estimatedMinutes: 8 },
  { id: 'brand_dna_generated', label: '生成品牌 DNA', route: '/brand-builder/profile', estimatedMinutes: 3 },
  { id: 'first_content_generated', label: '生成第一篇内容', route: '/content-engine', estimatedMinutes: 5 },
  { id: 'first_lead_captured', label: '获得第一位潜在客户', route: '/lead-magnet', estimatedMinutes: 10 },
];

const FUNNEL_DEFINITIONS: Array<Omit<ActivationFunnelStep, 'status' | 'completedAt'>> = [
  { id: 'SIGNUP', label: 'Signup', successSignal: 'Account created' },
  { id: 'AI_INTERVIEW', label: 'AI Interview', successSignal: 'Interview completed' },
  { id: 'BUSINESS_ANALYSIS', label: 'Business Analysis', successSignal: 'Business State generated' },
  { id: 'FIRST_MISSION', label: 'First Mission', successSignal: 'Mission started' },
  { id: 'FIRST_ASSET', label: 'First Asset', successSignal: 'Asset generated' },
  { id: 'FIRST_OUTCOME', label: 'First Outcome', successSignal: 'Outcome verified' },
  { id: 'ACTIVATED', label: 'Activated', successSignal: 'Value realized' },
];

function completedAtFor(step: ActivationStepId, facts: ActivationFacts) {
  const map: Record<ActivationStepId, Date | null> = {
    account_created: facts.userCreatedAt,
    interview_started: facts.interviewStartedAt,
    interview_completed: facts.interviewCompletedAt,
    brand_dna_generated: facts.brandDnaGeneratedAt,
    first_content_generated: facts.firstContentGeneratedAt,
    first_lead_captured: facts.firstLeadCapturedAt,
  };
  return map[step]?.toISOString() ?? null;
}

function buildSteps(facts: ActivationFacts, locale: ProductLocale): ActivationStep[] {
  const completed = completedActivationSteps(facts);
  const currentStep = STEP_DEFINITIONS.find((step) => !completed.has(step.id))?.id ?? 'first_lead_captured';

  return STEP_DEFINITIONS.map((step) => ({
    ...step,
    label: activationStepLabel(step.id, locale).value,
    completedAt: completedAtFor(step.id, facts),
    status: completed.has(step.id)
      ? 'completed'
      : step.id === currentStep
        ? 'current'
        : 'locked',
  }));
}

function completedAtForFunnelStep(step: ActivationFunnelStepId, facts: ActivationFacts) {
  const map: Record<ActivationFunnelStepId, Date | null> = {
    SIGNUP: facts.userCreatedAt,
    AI_INTERVIEW: facts.interviewCompletedAt,
    BUSINESS_ANALYSIS: facts.brandDnaGeneratedAt,
    FIRST_MISSION: facts.firstMissionStartedAt,
    FIRST_ASSET: facts.firstAssetGeneratedAt
      ?? facts.firstContentGeneratedAt
      ?? facts.leadMagnetGeneratedAt
      ?? facts.landingPagePublishedAt,
    FIRST_OUTCOME: facts.firstOutcomeVerifiedAt ?? facts.firstLeadCapturedAt,
    ACTIVATED: facts.firstOutcomeVerifiedAt,
  };

  return map[step]?.toISOString() ?? null;
}

function buildActivationFunnel(facts: ActivationFacts, locale: ProductLocale): ActivationFunnelStep[] {
  const completed = completedActivationFunnelSteps(facts);
  const currentStep = getActivationFunnelCurrentStep(facts);

  return FUNNEL_DEFINITIONS.map((step) => ({
    ...step,
    label: activationFunnelLabel(step.id, locale).value,
    successSignal: activationFunnelSuccessSignal(step.id, locale).value,
    completedAt: completedAtForFunnelStep(step.id, facts),
    status: completed.has(step.id)
      ? 'completed'
      : step.id === currentStep
        ? 'current'
        : 'locked',
  }));
}

function firstValueFor(facts: ActivationFacts, locale: ProductLocale): ActivationProjection['firstValue'] {
  if (facts.firstOutcomeVerifiedAt) {
    return {
      visible: true,
      type: 'first_outcome',
      label: activationFirstValueLabel('first_outcome', locale).value,
      achievedAt: facts.firstOutcomeVerifiedAt.toISOString(),
    };
  }

  if (facts.firstLeadCapturedAt) {
    return {
      visible: true,
      type: 'first_lead',
      label: activationFirstValueLabel('first_lead', locale).value,
      achievedAt: facts.firstLeadCapturedAt.toISOString(),
    };
  }

  if (facts.landingPagePublishedAt) {
    return {
      visible: true,
      type: 'first_funnel',
      label: activationFirstValueLabel('first_funnel', locale).value,
      achievedAt: facts.landingPagePublishedAt.toISOString(),
    };
  }

  const firstAssetAt = facts.firstAssetGeneratedAt ?? facts.leadMagnetGeneratedAt ?? facts.firstContentGeneratedAt;
  if (firstAssetAt) {
    return {
      visible: true,
      type: facts.firstContentGeneratedAt ? 'first_content' : 'first_asset',
      label: activationFirstValueLabel(facts.firstContentGeneratedAt ? 'first_content' : 'first_asset', locale).value,
      achievedAt: firstAssetAt.toISOString(),
    };
  }

  return {
    visible: false,
    type: 'none',
    label: activationFirstValueLabel('none', locale).value,
    achievedAt: null,
  };
}

function interventionsFor(input: {
  dropOffStage: ActivationProjection['dropOffStage'];
  dropOffRisk: ActivationProjection['dropOffRisk'];
  currentFunnelStep: ActivationFunnelStepId;
  locale: ProductLocale;
}): ActivationIntervention[] {
  if (input.dropOffRisk.state === 'ON_TRACK' || input.dropOffRisk.state === 'ACTIVATED') return [];
  if (input.dropOffRisk.state === 'AT_RISK') {
    const message = activationInterventionMessage('activation.intervention.atRisk', input.locale, {
      hours: input.dropOffRisk.hoursRemaining ?? 0,
    });

    return [{
      trigger: input.currentFunnelStep === 'FIRST_MISSION'
        ? 'mission_ignored'
        : input.currentFunnelStep === 'FIRST_ASSET'
          ? 'asset_not_reviewed'
          : input.currentFunnelStep === 'FIRST_OUTCOME'
            ? 'outcome_not_reached'
            : 'activation_stalled',
      action: input.currentFunnelStep === 'FIRST_MISSION' ? 'mission_reminder' : 'in_app_prompt',
      message: message.value,
      messageKey: message.key,
      locale: input.locale,
      translationSource: message.translationSource,
      fallbackUsed: message.fallbackUsed,
      route: input.currentFunnelStep === 'AI_INTERVIEW'
        ? '/brand-builder/step/interview'
        : input.currentFunnelStep === 'FIRST_ASSET'
          ? '/mission'
          : '/dashboard',
    }];
  }

  switch (input.dropOffStage) {
    case 'interview_dropoff': {
      const message = activationInterventionMessage('activation.intervention.interviewDropoff', input.locale);
      return [{
        trigger: 'activation_stalled',
        action: 'in_app_prompt',
        message: message.value,
        messageKey: message.key,
        locale: input.locale,
        translationSource: message.translationSource,
        fallbackUsed: message.fallbackUsed,
        route: '/brand-builder/step/interview',
      }];
    }
    case 'first_mission_dropoff': {
      const message = activationInterventionMessage('activation.intervention.firstMissionDropoff', input.locale);
      return [{
        trigger: 'mission_ignored',
        action: 'mission_reminder',
        message: message.value,
        messageKey: message.key,
        locale: input.locale,
        translationSource: message.translationSource,
        fallbackUsed: message.fallbackUsed,
        route: '/dashboard',
      }];
    }
    case 'first_asset_review_dropoff': {
      const message = activationInterventionMessage('activation.intervention.firstAssetReviewDropoff', input.locale);
      return [{
        trigger: 'asset_not_reviewed',
        action: 'in_app_prompt',
        message: message.value,
        messageKey: message.key,
        locale: input.locale,
        translationSource: message.translationSource,
        fallbackUsed: message.fallbackUsed,
        route: '/mission',
      }];
    }
    case 'first_outcome_dropoff':
    case 'landing_page_dropoff': {
      const message = activationInterventionMessage('activation.intervention.firstOutcomeDropoff', input.locale);
      return [{
        trigger: 'outcome_not_reached',
        action: 'ai_coo_recommendation',
        message: message.value,
        messageKey: message.key,
        locale: input.locale,
        translationSource: message.translationSource,
        fallbackUsed: message.fallbackUsed,
        route: '/dashboard',
      }];
    }
    case 'signup_dropoff':
    case 'brand_dna_dropoff':
    case 'content_dropoff':
    case 'lead_magnet_dropoff': {
      const message = activationInterventionMessage('activation.intervention.resumeProgress', input.locale);
      return [{
        trigger: 'activation_stalled',
        action: 'email',
        message: message.value,
        messageKey: message.key,
        locale: input.locale,
        translationSource: message.translationSource,
        fallbackUsed: message.fallbackUsed,
        route: input.currentFunnelStep === 'AI_INTERVIEW' ? '/brand-builder/step/interview' : '/dashboard',
      }];
    }
    case 'none':
      return [];
  }
}

function currentMissionFor(step: ActivationStep, locale: ProductLocale): ActivationProjection['currentMission'] {
  return {
    title: step.label,
    description: activationCurrentMissionDescription(step.id, locale).value,
    route: step.id === 'account_created' ? '/brand-builder/step/interview' : step.route,
    ctaLabel: activationCurrentMissionCta(step.id, step.status, locale).value,
    estimatedMinutes: step.estimatedMinutes,
  };
}

export function buildActivationProjection(
  facts: ActivationFacts,
  localizationInput: ActivationLocalizationInput = {},
): ActivationProjection {
  const localeResolution = resolveActivationLocale(localizationInput);
  const locale = localeResolution.locale;
  const activationScore = calculateActivationScore(facts);
  const steps = buildSteps(facts, locale);
  const currentStep = steps.find((step) => step.status === 'current') ?? steps[steps.length - 1];
  const activationFunnel = buildActivationFunnel(facts, locale);
  const currentFunnelStep = getActivationFunnelCurrentStep(facts);
  const dropOffRisk = getActivationDropOffRisk(facts);
  const dropOffStage = detectDropOffStage(facts);
  const timeToFirstWinMinutes = getTimeToFirstWinMinutes(facts);
  const firstWinAchieved = timeToFirstWinMinutes !== null;
  const activationRisk = dropOffRisk.riskLevel;
  const interviewCompletionRate = facts.interviewStartedAt ? (facts.interviewCompletedAt ? 100 : 0) : 0;
  const firstValue = firstValueFor(facts, locale);
  const activated = Boolean(facts.firstOutcomeVerifiedAt);
  const currentMission = currentMissionFor(currentStep, locale);
  const localization = buildActivationLocalizedCopy({
    resolution: localeResolution,
    state: dropOffRisk.state,
    currentStep: currentFunnelStep,
    firstValueType: firstValue.type,
    nextActionLabel: currentMission.ctaLabel,
    hoursRemaining: dropOffRisk.hoursRemaining,
  });

  return {
    source: 'ActivationEngine',
    scope: 'user',
    confidence: activationScore > 10 ? 'derived' : 'fallback',
    fallback: activationScore > 10 ? 'none' : 'new_user_no_activation_signal',
    generatedAt: facts.generatedAt,
    activationScore,
    activationThreshold: ACTIVATION_THRESHOLD,
    activationRisk,
    dropOffStage,
    activationState: {
      currentStep: currentFunnelStep,
      state: dropOffRisk.state,
      completionPercentage: activationScore,
      blockedReason: dropOffRisk.state === 'DROPPED_OFF' ? dropOffStage : undefined,
      activated,
      hoursRemaining: dropOffRisk.hoursRemaining,
      hoursSinceActivity: dropOffRisk.hoursSinceActivity,
    },
    dropOffRisk,
    localization,
    activationFunnel,
    firstValue,
    interventions: interventionsFor({ dropOffStage, dropOffRisk, currentFunnelStep, locale }),
    currentStep,
    steps,
    firstWin: {
      achieved: firstWinAchieved,
      targetMinutes: FIRST_WIN_TARGET_MINUTES,
      targetAssetSeconds: FIRST_ASSET_TARGET_SECONDS,
      timeToFirstWinMinutes,
      progressPercent: getFirstWinProgressPercent(facts),
      status: getFirstWinStatus(facts),
    },
    currentMission,
    shouldHideAdvancedModules: activationScore < ACTIVATION_THRESHOLD,
    kpis: {
      activationRate: activated ? 100 : 0,
      interviewCompletionRate,
      missionStartRate: facts.firstMissionStartedAt ? 100 : 0,
      assetGenerationRate: firstValue.visible ? 100 : 0,
      outcomeAchievementRate: facts.firstOutcomeVerifiedAt ? 100 : 0,
      timeToFirstWinMinutes,
      sevenDayRetentionSignal: Boolean(facts.lastActivityAt && (new Date(facts.generatedAt).getTime() - facts.userCreatedAt.getTime()) >= 7 * 86_400_000),
      thirtyDayRetentionSignal: Boolean(facts.lastActivityAt && (new Date(facts.generatedAt).getTime() - facts.userCreatedAt.getTime()) >= 30 * 86_400_000),
    },
  };
}
