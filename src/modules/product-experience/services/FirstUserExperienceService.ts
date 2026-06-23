import type { ActivationProjection } from '@/modules/activation/contracts/ActivationProjection';
import type { MissionExecutionWorkspace } from '@/modules/mission-workspace/services/MissionExecutionWorkspaceService';
import type { DashboardProjection } from '@/modules/dashboard/adapters/DashboardProjectionAdapter';
import { localizationEngine, type ProductLocale } from '@/modules/localization/services/LocalizationEngine';

export type FirstUserState = 'NEW' | 'ONBOARDING' | 'ACTIVE' | 'VALUE_REALIZED' | 'RETAINED';

export type FirstUserExperienceProjection = {
  source: 'FirstUserExperienceService';
  state: FirstUserState;
  headline: string;
  nextActionLabel: string;
  nextActionRoute: string;
  progressPercent: number;
  currentStep: string;
  nextMilestone: string;
  expectedValue: string;
  firstValueMoment: {
    achieved: boolean;
    label: string;
    targetMinutes: number;
    targetAssetSeconds: number;
  };
  activationStatus: {
    state: string;
    stateLabel: string;
    hoursRemaining: number | null;
    nextMilestone: string;
  };
  emptyStateAction: {
    label: string;
    route: string;
  };
};

function dashboardState(activation: ActivationProjection): FirstUserState {
  if (activation.kpis.thirtyDayRetentionSignal || activation.kpis.sevenDayRetentionSignal) return 'RETAINED';
  if (activation.activationState?.activated || activation.firstValue?.visible || activation.firstWin.achieved) return 'VALUE_REALIZED';
  if (activation.activationState?.currentStep === 'AI_INTERVIEW' || activation.activationState?.currentStep === 'BUSINESS_ANALYSIS') return 'ONBOARDING';
  if (activation.activationState?.currentStep === 'SIGNUP') return 'NEW';
  if (activation.currentStep.id === 'interview_started' || activation.currentStep.id === 'interview_completed') return 'ONBOARDING';
  if (activation.currentStep.id === 'account_created') return 'NEW';
  return 'ACTIVE';
}

function localized(key: string, locale: ProductLocale) {
  return localizationEngine.t(key, locale).value;
}

function stateHeadline(state: FirstUserState, locale: ProductLocale) {
  switch (state) {
    case 'NEW':
      return localized('activation.firstUser.headline.new', locale);
    case 'ONBOARDING':
      return localized('activation.firstUser.headline.onboarding', locale);
    case 'ACTIVE':
      return localized('activation.firstUser.headline.active', locale);
    case 'VALUE_REALIZED':
      return localized('activation.firstUser.headline.valueRealized', locale);
    case 'RETAINED':
      return localized('activation.firstUser.headline.retained', locale);
  }
}

export function buildFirstUserExperienceForDashboard(input: {
  activation: ActivationProjection;
  missionControl: DashboardProjection['missionControl'];
}): FirstUserExperienceProjection {
  const state = dashboardState(input.activation);
  const firstValueAchieved = state === 'VALUE_REALIZED' || state === 'RETAINED';
  const locale = input.activation.localization.locale;

  return {
    source: 'FirstUserExperienceService',
    state,
    headline: stateHeadline(state, locale),
    nextActionLabel: input.activation.currentMission.ctaLabel || input.missionControl.ctaLabel || '继续',
    nextActionRoute: state === 'NEW' || state === 'ONBOARDING'
      ? input.activation.currentMission.route || input.activation.currentStep.route
      : input.missionControl.route,
    progressPercent: input.activation.firstWin.achieved
      ? 100
      : Math.max(input.activation.firstWin.progressPercent, input.missionControl.progress),
    currentStep: input.activation.currentStep.label,
    nextMilestone: input.missionControl.nextMilestone,
    expectedValue: input.missionControl.expectedOutcome,
    firstValueMoment: {
      achieved: firstValueAchieved,
      label: firstValueAchieved
        ? input.activation.firstValue?.label ?? input.activation.localization.firstValueLabel
        : localized('activation.firstValue.generateFirstAsset', locale),
      targetMinutes: 10,
      targetAssetSeconds: 60,
    },
    activationStatus: {
      state: input.activation.activationState?.state ?? 'ON_TRACK',
      stateLabel: input.activation.localization.stateLabel,
      hoursRemaining: input.activation.activationState?.hoursRemaining ?? null,
      nextMilestone: input.missionControl.nextMilestone,
    },
    emptyStateAction: {
      label: state === 'NEW' || state === 'ONBOARDING'
        ? input.activation.localization.nextActionLabel
        : localized('activation.firstUser.empty.generateFirstAsset', locale),
      route: state === 'NEW' || state === 'ONBOARDING'
        ? input.activation.currentMission.route || input.activation.currentStep.route
        : input.missionControl.route,
    },
  };
}

export function buildFirstUserExperienceForWorkspace(input: {
  workspace: Omit<MissionExecutionWorkspace, 'firstUserExperience'>;
}): FirstUserExperienceProjection {
  const firstDraftAsset = input.workspace.generatedAssets.find((asset) => asset.outputLevel === 'DRAFT_ASSET');
  const achieved = Boolean(firstDraftAsset);
  const progressPercent = achieved
    ? 100
    : Math.max(input.workspace.progress.completionPercentage, input.workspace.businessOutcome.completionPercentage);

  return {
    source: 'FirstUserExperienceService',
    state: achieved ? 'VALUE_REALIZED' : 'ACTIVE',
    headline: achieved ? 'You have a first usable asset.' : 'Generate the first useful asset for this mission.',
    nextActionLabel: achieved ? 'Review asset' : 'Generate first asset',
    nextActionRoute: input.workspace.sourceRoute,
    progressPercent,
    currentStep: input.workspace.progress.currentStep?.title ?? 'Review generated assets',
    nextMilestone: input.workspace.nextMilestone,
    expectedValue: input.workspace.completion.completed
      ? 'Mission completed'
      : input.workspace.businessOutcome.name,
    firstValueMoment: {
      achieved,
      label: firstDraftAsset?.title ?? 'Generate a draft asset',
      targetMinutes: 10,
      targetAssetSeconds: 60,
    },
    activationStatus: {
      state: achieved ? 'ACTIVATED' : 'ON_TRACK',
      stateLabel: achieved ? 'Activated' : 'On track',
      hoursRemaining: null,
      nextMilestone: input.workspace.nextMilestone,
    },
    emptyStateAction: {
      label: 'Generate first asset',
      route: input.workspace.sourceRoute,
    },
  };
}

export const firstUserExperienceService = {
  buildForDashboard: buildFirstUserExperienceForDashboard,
  buildForWorkspace: buildFirstUserExperienceForWorkspace,
};
