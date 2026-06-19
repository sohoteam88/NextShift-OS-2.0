export type COOAuthorityScope = 'user' | 'tenant' | 'team' | 'platform';

export type COOConfidence = 'confirmed' | 'derived' | 'inferred' | 'fallback';

export type COORecommendationDomain =
  | 'brand'
  | 'content'
  | 'traffic'
  | 'funnel'
  | 'crm'
  | 'sales'
  | 'team'
  | 'operations';

export type COORecommendationPriority = 'low' | 'medium' | 'high' | 'critical';

export type COOPlanningHorizon = 'today' | 'week' | 'month' | 'quarter';

export interface COORecommendation {
  source: string;
  scope: COOAuthorityScope;
  confidence: COOConfidence;
  fallback: string | 'none';

  id: string;
  type: 'strategic';
  title: string;
  summary: string;
  domain: COORecommendationDomain;
  priority: COORecommendationPriority;
  horizon: COOPlanningHorizon;
  reasoning: string[];
  expectedOutcome: string;
  supportingSignals: string[];
  relatedRoute?: string;
}
