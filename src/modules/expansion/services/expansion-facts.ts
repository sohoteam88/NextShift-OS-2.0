import type { InterviewAuthorityBusinessMode } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { ValueProjection } from '@/modules/value/contracts/ValueProjection';
import type { RetentionProjection } from '@/modules/retention/contracts/RetentionProjection';
import type { ExpansionMetrics } from '../contracts/ExpansionProjection';

export type ExpansionFacts = {
  businessMode: InterviewAuthorityBusinessMode;
  generatedAt: string;
  valueProjection: ValueProjection;
  retentionProjection: RetentionProjection;
  metrics: ExpansionMetrics;
  outcomeCount?: number;
  lastOutcomeAt?: Date | string | null;
  lastRevenueGrowthAt?: Date | string | null;
  lastTeamProgressAt?: Date | string | null;
  opportunityAdoptionRate?: number;
  locale?: string | null;
  personalization?: {
    audience?: string | null;
    offer?: string | null;
    stage?: string | null;
    region?: string | null;
  };
};

export function growthRate(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function metric(current: number, previous: number) {
  return {
    current: Math.max(0, Math.round(current)),
    previous: Math.max(0, Math.round(previous)),
    growthRate: growthRate(current, previous),
  };
}

export function hasPositiveExpansion(metrics: ExpansionMetrics) {
  return Object.values(metrics).some((item) => item.current > 0 && item.growthRate > 0);
}
