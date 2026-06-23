import { extractCheckKeys } from '@/modules/mission/utils/completed-checks';

type EvolutionSignalInput = {
  brandInterview: boolean;
  brandDNA: boolean;
  socialSetup: boolean;
  contentCount: number;
  leadCount: number;
  customerCount: number;
  teamMemberCount: number;
  crmActive: boolean;
  followUpActive: boolean;
};

const SIGNAL_ALIASES = {
  brandInterview: ['brand_interview', 'brand_interview_completed', 'brand_discovery_completed'],
  brandDNA: ['brand_dna', 'brand_dna_completed', 'brand_dna_confirmed'],
  socialSetup: ['social_setup', 'social_setup_completed', 'fb_page_completed', 'ig_account_completed'],
  firstContent: ['first_content', 'first_content_generated', 'first_content_published', 'content_published'],
  firstLead: ['first_lead', 'first_lead_captured', 'lead_magnet_created', 'campaign_launched'],
  firstCustomer: ['first_customer', 'first_sale_completed'],
  followUpSystem: ['follow_up_system', 'first_followup_sent', 'whatsapp_ai_configured', 'crm_active'],
  firstMember: ['first_member', 'growth_mode_active'],
} as const;

function hasAny(checks: Set<string>, aliases: readonly string[]) {
  return aliases.some((alias) => checks.has(alias));
}

export function deriveEvolutionInput(input: {
  completedChecks?: unknown;
  progressPercent?: number | null;
}): EvolutionSignalInput {
  const completedChecks = extractCheckKeys(input.completedChecks ?? []);
  const checks = new Set(completedChecks);
  const progressPercent = input.progressPercent ?? 0;
  const followUpSystem = hasAny(checks, SIGNAL_ALIASES.followUpSystem) || progressPercent >= 85;

  return {
    brandInterview: hasAny(checks, SIGNAL_ALIASES.brandInterview) || progressPercent >= 10,
    brandDNA: hasAny(checks, SIGNAL_ALIASES.brandDNA) || progressPercent >= 25,
    socialSetup: hasAny(checks, SIGNAL_ALIASES.socialSetup) || progressPercent >= 35,
    contentCount: hasAny(checks, SIGNAL_ALIASES.firstContent) || progressPercent >= 40
      ? 3
      : progressPercent >= 30
        ? 1
        : 0,
    leadCount: hasAny(checks, SIGNAL_ALIASES.firstLead) || progressPercent >= 55 ? 1 : 0,
    customerCount: hasAny(checks, SIGNAL_ALIASES.firstCustomer) || progressPercent >= 70 ? 1 : 0,
    teamMemberCount: hasAny(checks, SIGNAL_ALIASES.firstMember) || progressPercent >= 95 ? 1 : 0,
    crmActive: followUpSystem,
    followUpActive: followUpSystem,
  };
}
