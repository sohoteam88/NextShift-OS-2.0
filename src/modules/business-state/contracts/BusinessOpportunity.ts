import type { BusinessStateDomain } from './BusinessBottleneck';

export type BusinessOpportunityImpact = 'low' | 'medium' | 'high';

export interface BusinessOpportunity {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  code: string;
  title: string;
  description: string;
  impact: BusinessOpportunityImpact;
  domain: BusinessStateDomain;
}
