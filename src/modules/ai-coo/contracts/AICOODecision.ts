import type { COORecommendationDomain, COORecommendationPriority } from './COORecommendation';

export type AICOODecisionPriority = COORecommendationPriority;
export type AICOODecisionConfidence = 'low' | 'medium' | 'high';

export type AICOOFocusArea =
  | 'activate_user'
  | 're_engage_user'
  | 'realize_value'
  | 'scale_results'
  | 'activate_advocacy'
  | 'build_authority'
  | 'generate_leads'
  | 'launch_offer'
  | 'improve_conversion'
  | 'increase_consistency';

export type AICOODecisionSignal = {
  code: string;
  title: string;
  reason: string;
  domain: COORecommendationDomain;
  priority: AICOODecisionPriority;
};

export type AICOODecisionAction = {
  id: string;
  title: string;
  reason: string;
  route?: string;
  successMetric: string;
};

export type AICOODecision = {
  decisionId: string;
  focusArea: AICOOFocusArea;
  currentFocus: string;
  reason: string;
  priority: AICOODecisionPriority;
  confidence: AICOODecisionConfidence;
  estimatedImpact: 'low' | 'medium' | 'high';
  estimatedEffort: 'low' | 'medium' | 'high';
  recommendedAction: AICOODecisionAction;
  nextBestAction: AICOODecisionAction;
  successMetric: string;
  primaryRisk: AICOODecisionSignal | null;
  primaryOpportunity: AICOODecisionSignal | null;
  recommendedMission: {
    id: string;
    title: string;
    route: string;
  };
  decisionReason: string;
  supportingActions: AICOODecisionAction[];
};
