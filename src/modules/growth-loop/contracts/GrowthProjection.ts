import type { GrowthSignalPriority } from './GrowthSignal';

export type GrowthStage =
  | 'content'
  | 'traffic'
  | 'lead'
  | 'conversation'
  | 'conversion'
  | 'retention'
  | 'referral';

export type GrowthBottleneck = {
  stage: GrowthStage;
  title: string;
  reason: string;
  severity: GrowthSignalPriority;
  metric?: string;
};

export type GrowthOpportunity = {
  stage: GrowthStage;
  title: string;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  metric?: string;
};

export type GrowthAction = {
  title: string;
  reason: string;
  route?: string;
  owner: 'growth-loop';
  expectedMetricLift: string;
};

export type GrowthProjection = {
  source: 'GrowthLoopEngine';
  scope: 'user';
  confidence: 'confirmed' | 'derived' | 'fallback';
  fallback: string | 'none';
  generatedAt: string;
  currentGrowthStage: GrowthStage;
  growthScore: number;
  primaryBottleneck: GrowthBottleneck | null;
  primaryOpportunity: GrowthOpportunity | null;
  recommendedGrowthAction: GrowthAction;
};
