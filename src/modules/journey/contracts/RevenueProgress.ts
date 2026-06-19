export interface RevenueProgress {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  currentMilestone: string;
  nextMilestone: string;
  completionPercent: number;
  achievedMilestones: string[];
}
