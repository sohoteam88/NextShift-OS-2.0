import { extractCheckKeys } from '@/modules/mission/utils/completed-checks';
import type { UserLevel } from '@/modules/user-evolution/types/evolution.types';

export type JourneyCompletionInput = {
  completedChecks?: unknown;
  progressPercent?: number | null;
};

export type JourneyCompletionState = {
  completedChecks: string[];
  progressPercent: number;
  brandInterview: boolean;
  brandDNA: boolean;
  socialSetup: boolean;
  firstContent: boolean;
  firstLead: boolean;
  firstCustomer: boolean;
  followUpSystem: boolean;
  firstMember: boolean;
  isComplete: boolean;
};

export const JOURNEY_COMPLETION_ALIASES = {
  brandInterview: ['brand_interview', 'brand_interview_completed', 'brand_discovery_completed'],
  brandDNA: ['brand_dna', 'brand_dna_completed', 'brand_dna_confirmed'],
  socialSetup: ['social_setup', 'social_setup_completed', 'fb_page_completed', 'ig_account_completed'],
  firstContent: ['first_content', 'first_content_generated', 'first_content_published', 'content_published'],
  firstLead: ['first_lead', 'first_lead_captured', 'lead_magnet_created', 'campaign_launched'],
  firstCustomer: ['first_customer', 'first_sale_completed'],
  followUpSystem: ['follow_up_system', 'first_followup_sent', 'whatsapp_ai_configured', 'crm_active'],
  firstMember: ['first_member', 'growth_mode_active'],
} as const;

function hasAny(checks: Set<string>, keys: readonly string[]) {
  return keys.some((key) => checks.has(key));
}

function pctAtLeast(progressPercent: number, threshold: number) {
  return Number.isFinite(progressPercent) && progressPercent >= threshold;
}

export function resolveJourneyCompletion(input: JourneyCompletionInput = {}): JourneyCompletionState {
  const completedChecks = extractCheckKeys(input.completedChecks ?? []);
  const checks = new Set(completedChecks);
  const progressPercent = input.progressPercent ?? 0;

  const state = {
    completedChecks,
    progressPercent,
    brandInterview: hasAny(checks, JOURNEY_COMPLETION_ALIASES.brandInterview) || pctAtLeast(progressPercent, 10),
    brandDNA: hasAny(checks, JOURNEY_COMPLETION_ALIASES.brandDNA) || pctAtLeast(progressPercent, 25),
    socialSetup: hasAny(checks, JOURNEY_COMPLETION_ALIASES.socialSetup) || pctAtLeast(progressPercent, 35),
    firstContent: hasAny(checks, JOURNEY_COMPLETION_ALIASES.firstContent) || pctAtLeast(progressPercent, 40),
    firstLead: hasAny(checks, JOURNEY_COMPLETION_ALIASES.firstLead) || pctAtLeast(progressPercent, 55),
    firstCustomer: hasAny(checks, JOURNEY_COMPLETION_ALIASES.firstCustomer) || pctAtLeast(progressPercent, 70),
    followUpSystem: hasAny(checks, JOURNEY_COMPLETION_ALIASES.followUpSystem) || pctAtLeast(progressPercent, 85),
    firstMember: hasAny(checks, JOURNEY_COMPLETION_ALIASES.firstMember) || pctAtLeast(progressPercent, 95),
  };

  return {
    ...state,
    isComplete:
      state.brandInterview &&
      state.brandDNA &&
      state.firstContent &&
      state.firstLead &&
      state.firstCustomer &&
      state.followUpSystem &&
      state.firstMember,
  };
}

export function toJourneyNextActionInput(state: JourneyCompletionState) {
  return {
    brandInterview: state.brandInterview,
    brandDNA: state.brandDNA,
    firstContent: state.firstContent,
    firstLead: state.firstLead,
    firstCustomer: state.firstCustomer,
    followUpSystem: state.followUpSystem,
    firstMember: state.firstMember,
  };
}

export function toMissionInput(state: JourneyCompletionState, level: UserLevel) {
  return {
    level,
    brandInterview: state.brandInterview,
    brandDNA: state.brandDNA,
    socialSetup: state.socialSetup,
    hasContent: state.firstContent,
    hasLead: state.firstLead,
    hasCustomer: state.firstCustomer,
    teamMemberCount: state.firstMember ? 1 : 0,
  };
}
