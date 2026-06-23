import type { BusinessBottleneck } from '@/modules/business-state/contracts/BusinessBottleneck';
import type { BusinessStateResult, BusinessCapabilityState } from '@/modules/business-state/contracts/BusinessStateResult';
import type {
  MissionAuthorityDefinition,
  MissionBusinessStage,
} from '../contracts/MissionAuthority';

const STAGE_BY_COMPLETION_CONDITION: Array<{ condition: string; stage: MissionBusinessStage }> = [
  { condition: 'brand_discovery_completed', stage: 'BRAND_FOUNDATION' },
  { condition: 'brand_dna_confirmed', stage: 'BRAND_POSITIONING' },
  { condition: 'positioning_completed', stage: 'BRAND_POSITIONING' },
  { condition: 'first_content_generated', stage: 'CONTENT_SYSTEM' },
  { condition: 'lead_magnet_created', stage: 'LEAD_MAGNET' },
  { condition: 'funnel_published', stage: 'FUNNEL' },
  { condition: 'traffic_campaign_launched', stage: 'LEAD_GENERATION' },
  { condition: 'whatsapp_followup_configured', stage: 'SALES' },
  { condition: 'crm_setup_completed', stage: 'SALES' },
  { condition: 'first_sale_completed', stage: 'SALES' },
  { condition: 'growth_mode_active', stage: 'TEAM_BUILDING' },
  { condition: 'delegation_ready', stage: 'TEAM_BUILDING' },
];

const DOMAIN_BY_STATE: Record<BusinessCapabilityState, BusinessBottleneck['domain']> = {
  BRAND_FOUNDATION: 'brand',
  BRAND_POSITIONING: 'brand',
  CONTENT_SYSTEM: 'content',
  LEAD_MAGNET: 'funnel',
  FUNNEL: 'funnel',
  LEAD_GENERATION: 'traffic',
  SALES: 'sales',
  TEAM_BUILDING: 'sales',
};

function stageForMission(mission: MissionAuthorityDefinition): MissionBusinessStage {
  const match = STAGE_BY_COMPLETION_CONDITION.find((entry) => (
    mission.completionConditions.includes(entry.condition)
  ));
  return match?.stage ?? 'BRAND_FOUNDATION';
}

export const BottleneckAuthority = {
  businessStageFor(input: {
    businessState?: BusinessStateResult | null;
    mission?: MissionAuthorityDefinition | null;
  }): MissionBusinessStage {
    if (input.businessState) return input.businessState.currentState;
    if (input.mission) return stageForMission(input.mission);
    return 'BRAND_FOUNDATION';
  },

  toBusinessBottleneck(stateResult: BusinessStateResult): BusinessBottleneck {
    const firstMissing = stateResult.missingRequirements[0] ?? 'Next capability';

    return {
      source: 'BottleneckAuthority',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      code: `capability_${stateResult.currentState.toLowerCase()}`,
      title: `Complete ${stateResult.currentState.replaceAll('_', ' ').toLowerCase()}`,
      description: stateResult.explainability.reason || `Missing requirement: ${firstMissing}.`,
      severity: stateResult.currentState === 'BRAND_FOUNDATION' ? 'high' : 'medium',
      domain: DOMAIN_BY_STATE[stateResult.currentState],
    };
  },
};
