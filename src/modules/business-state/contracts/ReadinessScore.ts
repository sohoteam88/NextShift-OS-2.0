export interface ReadinessScore {
  source: string;
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';

  score: number;
  maxScore: number;
  percentage: number;
}
