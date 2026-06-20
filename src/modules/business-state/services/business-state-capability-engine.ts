import type {
  BusinessCapabilityState,
  BusinessStateRequirementStatus,
  BusinessStateResult,
} from '../contracts/BusinessStateResult';

export type BusinessStateCapabilityFacts = {
  completedChecks: string[];
  interviewCompleted: boolean;
  businessContextCreated: boolean;
  personalStoryCaptured: boolean;
  targetAudienceDefined: boolean;
  nicheSelected: boolean;
  audiencePainDefined: boolean;
  transformationDefined: boolean;
  offerDirectionDefined: boolean;
  contentPillarsCreated: boolean;
  contentCalendarGenerated: boolean;
  minimumContentAssetsCreated: boolean;
  contentEngineActivated: boolean;
  leadMagnetCreated: boolean;
  leadMagnetPublished: boolean;
  leadMagnetCtaActive: boolean;
  landingPageCreated: boolean;
  thankYouPageCreated: boolean;
  ctaRoutingActive: boolean;
  leadFlowTested: boolean;
  leadSourceActive: boolean;
  trafficSourceActive: boolean;
  firstLeadGenerated: boolean;
  leadExists: boolean;
  offerExists: boolean;
  salesProcessExists: boolean;
  firstCustomerAcquired: boolean;
  revenueExists: boolean;
  processDocumented: boolean;
  delegationReady: boolean;
  agentWorkforceActive: boolean;
  humanTeamAdded: boolean;
};

type RequirementDefinition = {
  id: keyof BusinessStateCapabilityFacts;
  label: string;
};

type StateDefinition = {
  state: BusinessCapabilityState;
  successCriteria: string;
  missingReason: string;
  requirements: RequirementDefinition[];
};

const STATE_ORDER: BusinessCapabilityState[] = [
  'BRAND_FOUNDATION',
  'BRAND_POSITIONING',
  'CONTENT_SYSTEM',
  'LEAD_MAGNET',
  'FUNNEL',
  'LEAD_GENERATION',
  'SALES',
  'TEAM_BUILDING',
];

const STATE_DEFINITIONS: StateDefinition[] = [
  {
    state: 'BRAND_FOUNDATION',
    successCriteria: 'Business Identity Exists',
    missingReason: 'Business profile incomplete.',
    requirements: [
      { id: 'interviewCompleted', label: 'AI Interview Completed' },
      { id: 'businessContextCreated', label: 'Business Context Created' },
      { id: 'personalStoryCaptured', label: 'Personal Story Captured' },
      { id: 'targetAudienceDefined', label: 'Target Audience Defined' },
    ],
  },
  {
    state: 'BRAND_POSITIONING',
    successCriteria: 'User knows who they help, what problem they solve, and why they are different',
    missingReason: 'Market position clarity is incomplete.',
    requirements: [
      { id: 'nicheSelected', label: 'Niche Selected' },
      { id: 'audiencePainDefined', label: 'Audience Pain Defined' },
      { id: 'transformationDefined', label: 'Transformation Defined' },
      { id: 'offerDirectionDefined', label: 'Offer Direction Defined' },
    ],
  },
  {
    state: 'CONTENT_SYSTEM',
    successCriteria: 'User can consistently publish content',
    missingReason: 'Content publishing capability is incomplete.',
    requirements: [
      { id: 'contentPillarsCreated', label: 'Content Pillars Created' },
      { id: 'contentCalendarGenerated', label: 'Content Calendar Generated' },
      { id: 'minimumContentAssetsCreated', label: 'Minimum Content Assets Created' },
      { id: 'contentEngineActivated', label: 'Content Engine Activated' },
    ],
  },
  {
    state: 'LEAD_MAGNET',
    successCriteria: 'User can exchange value for contact information',
    missingReason: 'Lead capture capability is incomplete.',
    requirements: [
      { id: 'leadMagnetCreated', label: 'Lead Magnet Created' },
      { id: 'leadMagnetPublished', label: 'Lead Magnet Published' },
      { id: 'leadMagnetCtaActive', label: 'Lead Magnet CTA Active' },
    ],
  },
  {
    state: 'FUNNEL',
    successCriteria: 'Lead journey is functional',
    missingReason: 'Lead conversion journey is incomplete.',
    requirements: [
      { id: 'landingPageCreated', label: 'Landing Page Created' },
      { id: 'thankYouPageCreated', label: 'Thank You Page Created' },
      { id: 'ctaRoutingActive', label: 'CTA Routing Active' },
      { id: 'leadFlowTested', label: 'Lead Flow Tested' },
    ],
  },
  {
    state: 'LEAD_GENERATION',
    successCriteria: 'At least one lead acquired',
    missingReason: 'Traffic acquisition capability is incomplete.',
    requirements: [
      { id: 'leadSourceActive', label: 'Lead Source Active' },
      { id: 'trafficSourceActive', label: 'Traffic Source Active' },
      { id: 'firstLeadGenerated', label: 'First Lead Generated' },
    ],
  },
  {
    state: 'SALES',
    successCriteria: 'First Revenue Generated',
    missingReason: 'Revenue generation capability is incomplete.',
    requirements: [
      { id: 'leadExists', label: 'Lead Exists' },
      { id: 'offerExists', label: 'Offer Exists' },
      { id: 'salesProcessExists', label: 'Sales Process Exists' },
      { id: 'firstCustomerAcquired', label: 'First Customer Acquired' },
    ],
  },
  {
    state: 'TEAM_BUILDING',
    successCriteria: 'Business operates beyond founder',
    missingReason: 'Scale-through-people capability is incomplete.',
    requirements: [
      { id: 'revenueExists', label: 'Revenue Exists' },
      { id: 'processDocumented', label: 'Process Documented' },
      { id: 'delegationReady', label: 'Delegation Ready' },
      { id: 'agentWorkforceActive', label: 'Agent Workforce Active' },
      { id: 'humanTeamAdded', label: 'Human Team Added' },
    ],
  },
];

function requirementStatuses(
  facts: BusinessStateCapabilityFacts,
  definition: StateDefinition,
): BusinessStateRequirementStatus[] {
  return definition.requirements.map((requirement) => ({
    id: requirement.id,
    label: requirement.label,
    completed: Boolean(facts[requirement.id]),
  }));
}

function isStateComplete(facts: BusinessStateCapabilityFacts, definition: StateDefinition) {
  return definition.requirements.every((requirement) => Boolean(facts[requirement.id]));
}

function nextStateFor(state: BusinessCapabilityState): BusinessCapabilityState {
  const index = STATE_ORDER.indexOf(state);
  return STATE_ORDER[Math.min(index + 1, STATE_ORDER.length - 1)] ?? 'TEAM_BUILDING';
}

function readinessScore(facts: BusinessStateCapabilityFacts) {
  const requirements = STATE_DEFINITIONS.flatMap((definition) => definition.requirements);
  const completed = requirements.filter((requirement) => Boolean(facts[requirement.id])).length;
  return Math.round((completed / requirements.length) * 100);
}

export function resolveBusinessStateResult(facts: BusinessStateCapabilityFacts): BusinessStateResult {
  const completedStates: BusinessCapabilityState[] = [];

  for (const definition of STATE_DEFINITIONS) {
    const missing = requirementStatuses(facts, definition).filter((requirement) => !requirement.completed);
    if (missing.length === 0) {
      completedStates.push(definition.state);
      continue;
    }

    return {
      currentState: definition.state,
      completedStates,
      missingRequirements: missing.map((requirement) => requirement.label),
      nextState: nextStateFor(definition.state),
      readinessScore: readinessScore(facts),
      explainability: {
        completed: completedStates,
        missing,
        reason: `${definition.missingReason} Missing first capability: ${missing[0]?.label}. Success criteria: ${definition.successCriteria}.`,
      },
    };
  }

  return {
    currentState: 'TEAM_BUILDING',
    completedStates: [...STATE_ORDER],
    missingRequirements: [],
    nextState: 'TEAM_BUILDING',
    readinessScore: 100,
    explainability: {
      completed: [...STATE_ORDER],
      missing: [],
      reason: 'All V8 Business State capabilities are complete. The business can operate beyond the founder.',
    },
  };
}
