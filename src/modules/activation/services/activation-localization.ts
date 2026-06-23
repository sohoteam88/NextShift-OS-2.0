import type {
  ActivationFunnelStepId,
  ActivationProgressState,
  ActivationStepId,
} from '../contracts/ActivationProjection';
import {
  localizationEngine,
  type LocaleResolution,
  type LocaleResolutionInput,
  type LocalizedValue,
  type ProductLocale,
} from '@/modules/localization/services/LocalizationEngine';

export type ActivationLocalizationInput = LocaleResolutionInput;

export type ActivationLocalizedCopy = {
  locale: ProductLocale;
  localeSource: LocaleResolution['source'];
  translationSource: LocalizedValue['translationSource'];
  fallbackUsed: boolean;
  messageKeys: string[];
  stateLabel: string;
  currentStepLabel: string;
  nextActionLabel: string;
  firstValueLabel: string;
  recoveryMessage: string;
  aiCooRiskTitle: string;
  aiCooRiskReason: string;
};

const STATE_KEYS: Record<ActivationProgressState, string> = {
  ACTIVE: 'activation.state.active',
  ON_TRACK: 'activation.state.onTrack',
  AT_RISK: 'activation.state.atRisk',
  DROPPED_OFF: 'activation.state.droppedOff',
  ACTIVATED: 'activation.state.activated',
};

const STEP_KEYS: Record<ActivationStepId, string> = {
  account_created: 'activation.step.accountCreated',
  interview_started: 'activation.step.interviewStarted',
  interview_completed: 'activation.step.interviewCompleted',
  brand_dna_generated: 'activation.step.brandDnaGenerated',
  first_content_generated: 'activation.step.firstContentGenerated',
  first_lead_captured: 'activation.step.firstLeadCaptured',
};

const FUNNEL_KEYS: Record<ActivationFunnelStepId, string> = {
  SIGNUP: 'activation.funnel.signup',
  AI_INTERVIEW: 'activation.funnel.aiInterview',
  BUSINESS_ANALYSIS: 'activation.funnel.businessAnalysis',
  FIRST_MISSION: 'activation.funnel.firstMission',
  FIRST_ASSET: 'activation.funnel.firstAsset',
  FIRST_OUTCOME: 'activation.funnel.firstOutcome',
  ACTIVATED: 'activation.funnel.activated',
};

const FUNNEL_SUCCESS_KEYS: Record<ActivationFunnelStepId, string> = {
  SIGNUP: 'activation.success.accountCreated',
  AI_INTERVIEW: 'activation.success.interviewCompleted',
  BUSINESS_ANALYSIS: 'activation.success.businessStateGenerated',
  FIRST_MISSION: 'activation.success.missionStarted',
  FIRST_ASSET: 'activation.success.assetGenerated',
  FIRST_OUTCOME: 'activation.success.outcomeVerified',
  ACTIVATED: 'activation.success.valueRealized',
};

const FIRST_VALUE_KEYS = {
  none: 'activation.firstValue.none',
  first_asset: 'activation.firstValue.firstAsset',
  first_content: 'activation.firstValue.firstContent',
  first_funnel: 'activation.firstValue.firstFunnel',
  first_lead: 'activation.firstValue.firstLead',
  first_outcome: 'activation.firstValue.firstOutcome',
} as const;

const DESCRIPTION_KEYS: Record<ActivationStepId, string> = {
  account_created: 'activation.currentMission.accountCreated.description',
  interview_started: 'activation.currentMission.interviewStarted.description',
  interview_completed: 'activation.currentMission.interviewCompleted.description',
  brand_dna_generated: 'activation.currentMission.brandDnaGenerated.description',
  first_content_generated: 'activation.currentMission.firstContentGenerated.description',
  first_lead_captured: 'activation.currentMission.firstLeadCaptured.description',
};

function interpolate(value: string, params: Record<string, string | number> = {}) {
  return Object.entries(params).reduce((text, [key, replacement]) => (
    text.replaceAll(`{${key}}`, String(replacement))
  ), value);
}

function localize(
  key: string,
  locale: ProductLocale,
  params?: Record<string, string | number>,
): LocalizedValue {
  const localized = localizationEngine.t(key, locale);

  return {
    ...localized,
    value: interpolate(localized.value, params),
  };
}

function combineMeta(values: LocalizedValue[]) {
  return {
    translationSource: values.some((value) => value.translationSource === 'missing')
      ? 'missing' as const
      : values.some((value) => value.translationSource === 'fallback')
        ? 'fallback' as const
        : 'registry' as const,
    fallbackUsed: values.some((value) => value.fallbackUsed),
    messageKeys: values.map((value) => value.key),
  };
}

export function resolveActivationLocale(input: ActivationLocalizationInput = {}) {
  return localizationEngine.resolveLocale(input);
}

export function activationStateLabel(state: ActivationProgressState, locale: ProductLocale) {
  return localize(STATE_KEYS[state], locale);
}

export function activationStepLabel(step: ActivationStepId, locale: ProductLocale) {
  return localize(STEP_KEYS[step], locale);
}

export function activationFunnelLabel(step: ActivationFunnelStepId, locale: ProductLocale) {
  return localize(FUNNEL_KEYS[step], locale);
}

export function activationFunnelSuccessSignal(step: ActivationFunnelStepId, locale: ProductLocale) {
  return localize(FUNNEL_SUCCESS_KEYS[step], locale);
}

export function activationFirstValueLabel(
  type: keyof typeof FIRST_VALUE_KEYS,
  locale: ProductLocale,
) {
  return localize(FIRST_VALUE_KEYS[type], locale);
}

export function activationCurrentMissionDescription(step: ActivationStepId, locale: ProductLocale) {
  return localize(DESCRIPTION_KEYS[step], locale);
}

export function activationCurrentMissionCta(
  step: ActivationStepId,
  status: 'completed' | 'current' | 'locked',
  locale: ProductLocale,
) {
  if (step === 'account_created') return localize('activation.currentMission.startInterview', locale);
  if (step === 'first_lead_captured' && status === 'completed') {
    return localize('activation.currentMission.viewLeads', locale);
  }
  return localize('activation.currentMission.continueActivation', locale);
}

export function activationInterventionMessage(
  key:
    | 'activation.intervention.atRisk'
    | 'activation.intervention.interviewDropoff'
    | 'activation.intervention.firstMissionDropoff'
    | 'activation.intervention.firstAssetReviewDropoff'
    | 'activation.intervention.firstOutcomeDropoff'
    | 'activation.intervention.resumeProgress',
  locale: ProductLocale,
  params?: Record<string, string | number>,
) {
  return localize(key, locale, params);
}

export function activationRecoveryMessage(locale: ProductLocale) {
  return localize('activation.recovery.paused', locale);
}

export function buildActivationLocalizedCopy(input: {
  resolution: LocaleResolution;
  state: ActivationProgressState;
  currentStep: ActivationFunnelStepId;
  firstValueType: keyof typeof FIRST_VALUE_KEYS;
  nextActionLabel: string;
  hoursRemaining: number | null;
}) {
  const locale = input.resolution.locale;
  const noTimer = localize('activation.risk.noTimer', locale);
  const stateLabel = activationStateLabel(input.state, locale);
  const currentStepLabel = activationFunnelLabel(input.currentStep, locale);
  const firstValueLabel = activationFirstValueLabel(input.firstValueType, locale);
  const recoveryMessage = activationRecoveryMessage(locale);
  const riskTitle = localize(
    input.state === 'DROPPED_OFF'
      ? 'activation.risk.droppedOffTitle'
      : 'activation.risk.atRiskTitle',
    locale,
  );
  const riskReason = localize('activation.risk.reason', locale, {
    state: stateLabel.value,
    step: currentStepLabel.value,
    hours: input.hoursRemaining ?? noTimer.value,
  });
  const values = [
    stateLabel,
    currentStepLabel,
    firstValueLabel,
    recoveryMessage,
    riskTitle,
    riskReason,
    noTimer,
  ];
  const meta = combineMeta(values);

  return {
    locale,
    localeSource: input.resolution.source,
    ...meta,
    fallbackUsed: input.resolution.fallbackUsed || meta.fallbackUsed,
    stateLabel: stateLabel.value,
    currentStepLabel: currentStepLabel.value,
    nextActionLabel: input.nextActionLabel,
    firstValueLabel: firstValueLabel.value,
    recoveryMessage: recoveryMessage.value,
    aiCooRiskTitle: riskTitle.value,
    aiCooRiskReason: riskReason.value,
  } satisfies ActivationLocalizedCopy;
}
