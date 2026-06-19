export type BusinessMode =
  | 'retail'
  | 'recruitment'
  | 'hybrid'
  | 'team_building'
  | 'franchise';

export interface BusinessContextSnapshot {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  businessMode: BusinessMode;
  primaryOffer: string;
  revenueModel: string;
  businessStage: 'idea' | 'validation' | 'traction' | 'growth' | 'scale';
  targetRevenueGoal: string;
  primaryGrowthChannel: string;

  createdAt: string;
  updatedAt: string;
}
