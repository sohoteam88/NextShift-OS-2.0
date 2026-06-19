export type OptimizationArea =
  | 'journey'
  | 'mission'
  | 'content'
  | 'funnel'
  | 'agent'
  | 'growth';

export type OptimizationPattern = {
  area: OptimizationArea;
  title: string;
  reason: string;
  confidenceDelta: number;
  usageRecommendation: 'increase' | 'decrease' | 'monitor';
};

export type RecommendedSystemChange = {
  area: OptimizationArea;
  title: string;
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
};

export type OptimizationProjection = {
  source: 'OptimizationEngine';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  generatedAt: string;
  optimizationScore: number;
  currentOptimizationFocus: string;
  topWinningPatterns: OptimizationPattern[];
  topFailurePatterns: OptimizationPattern[];
  recommendedSystemChanges: RecommendedSystemChange[];
  recommendedAgentChanges: RecommendedSystemChange[];
  recommendedJourneyChanges: RecommendedSystemChange[];
};
