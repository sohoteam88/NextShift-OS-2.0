export type BusinessCapabilityState =
  | 'BRAND_FOUNDATION'
  | 'BRAND_POSITIONING'
  | 'CONTENT_SYSTEM'
  | 'LEAD_MAGNET'
  | 'FUNNEL'
  | 'LEAD_GENERATION'
  | 'SALES'
  | 'TEAM_BUILDING';

export type BusinessStateRequirementStatus = {
  id: string;
  label: string;
  completed: boolean;
};

export type BusinessStateExplainability = {
  completed: BusinessCapabilityState[];
  missing: BusinessStateRequirementStatus[];
  reason: string;
};

export interface BusinessStateResult {
  currentState: BusinessCapabilityState;
  completedStates: BusinessCapabilityState[];
  missingRequirements: string[];
  nextState: BusinessCapabilityState;
  readinessScore: number;
  explainability: BusinessStateExplainability;
}
