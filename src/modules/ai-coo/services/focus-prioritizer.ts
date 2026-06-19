import type { JourneyState } from '@/modules/journey/contracts/JourneyState';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';
import type { AICOODecisionSignal, AICOOFocusArea } from '../contracts/AICOODecision';

function focusForDomain(domain: AICOODecisionSignal['domain']): AICOOFocusArea {
  switch (domain) {
    case 'brand':
    case 'content':
      return 'build_authority';
    case 'traffic':
    case 'funnel':
    case 'crm':
      return 'generate_leads';
    case 'sales':
      return 'launch_offer';
    case 'team':
    case 'operations':
      return 'increase_consistency';
  }
}

function focusForJourney(stage: JourneyState['stage'], mission: MissionAuthoritySnapshot['currentMission']): AICOOFocusArea {
  if (mission.id.toLowerCase().includes('offer')) return 'launch_offer';

  switch (stage) {
    case 'brand_foundation':
    case 'audience_validation':
    case 'content_activation':
      return 'build_authority';
    case 'offer_creation':
      return 'launch_offer';
    case 'lead_generation':
      return 'generate_leads';
    case 'customer_acquisition':
      return 'improve_conversion';
    case 'team_growth':
    case 'scale':
      return 'increase_consistency';
  }
}

export function prioritizeFocus(input: {
  risks: AICOODecisionSignal[];
  opportunities: AICOODecisionSignal[];
  journeyState: JourneyState;
  missionAuthority: MissionAuthoritySnapshot;
}): {
  focusArea: AICOOFocusArea;
  basis: AICOODecisionSignal | null;
  basisType: 'risk' | 'opportunity' | 'mission';
} {
  const primaryRisk = input.risks[0];
  if (primaryRisk?.code.startsWith('activation_')) {
    return {
      focusArea: 'activate_user',
      basis: primaryRisk,
      basisType: 'risk',
    };
  }

  if (primaryRisk?.code.startsWith('retention_')) {
    return {
      focusArea: 're_engage_user',
      basis: primaryRisk,
      basisType: 'risk',
    };
  }

  if (primaryRisk?.code.startsWith('value_')) {
    return {
      focusArea: 'realize_value',
      basis: primaryRisk,
      basisType: 'risk',
    };
  }

  if (primaryRisk?.code.startsWith('expansion_')) {
    return {
      focusArea: 'scale_results',
      basis: primaryRisk,
      basisType: 'risk',
    };
  }

  if (primaryRisk?.code === 'referral_value_not_proven') {
    return {
      focusArea: 'realize_value',
      basis: primaryRisk,
      basisType: 'risk',
    };
  }

  if (primaryRisk?.code === 'referral_retention_weak') {
    return {
      focusArea: 're_engage_user',
      basis: primaryRisk,
      basisType: 'risk',
    };
  }

  if (primaryRisk?.code.startsWith('referral_')) {
    return {
      focusArea: 'activate_advocacy',
      basis: primaryRisk,
      basisType: 'risk',
    };
  }

  if (primaryRisk && (primaryRisk.priority === 'critical' || primaryRisk.priority === 'high')) {
    return {
      focusArea: focusForDomain(primaryRisk.domain),
      basis: primaryRisk,
      basisType: 'risk',
    };
  }

  const primaryOpportunity = input.opportunities[0];
  if (primaryOpportunity?.code.startsWith('expansion_')) {
    return {
      focusArea: 'scale_results',
      basis: primaryOpportunity,
      basisType: 'opportunity',
    };
  }

  if (primaryOpportunity?.code.startsWith('referral_')) {
    return {
      focusArea: 'activate_advocacy',
      basis: primaryOpportunity,
      basisType: 'opportunity',
    };
  }

  if (primaryOpportunity && (primaryOpportunity.priority === 'critical' || primaryOpportunity.priority === 'high')) {
    return {
      focusArea: focusForDomain(primaryOpportunity.domain),
      basis: primaryOpportunity,
      basisType: 'opportunity',
    };
  }

  return {
    focusArea: focusForJourney(input.journeyState.stage, input.missionAuthority.currentMission),
    basis: null,
    basisType: 'mission',
  };
}
