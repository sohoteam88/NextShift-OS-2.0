export type GrowthLoopScope = 'user' | 'tenant' | 'team' | 'platform';

export type GrowthSignalConfidence =
  | 'confirmed'
  | 'derived'
  | 'inferred'
  | 'fallback';

export type GrowthSignalDomain =
  | 'acquisition'
  | 'activation'
  | 'retention'
  | 'referral'
  | 'expansion';

export type GrowthSignalStatus =
  | 'missing'
  | 'draft'
  | 'ready'
  | 'active'
  | 'blocked'
  | 'complete';

export type GrowthSignalPriority = 'low' | 'medium' | 'high' | 'critical';

export interface GrowthSignalMetric {
  key: string;
  label: string;
  value: number;
  unit: 'count' | 'percent' | 'score' | 'currency' | 'days';
  target?: number;
}

export interface GrowthSignalEvidence {
  source: string;
  route?: string;
  recordId?: string;
  description: string;
  observedAt?: string;
}

export interface GrowthSignalRecommendation {
  id: string;
  title: string;
  summary: string;
  priority: GrowthSignalPriority;
  route?: string;
  owner?: string;
}

export interface GrowthSignal {
  source: string;
  scope: GrowthLoopScope;
  confidence: GrowthSignalConfidence;
  fallback: string | 'none';

  id: string;
  domain: GrowthSignalDomain;
  status: GrowthSignalStatus;
  score: number;
  summary: string;
  metrics: GrowthSignalMetric[];
  evidence: GrowthSignalEvidence[];
  recommendations: GrowthSignalRecommendation[];
  generatedAt: string;
}
