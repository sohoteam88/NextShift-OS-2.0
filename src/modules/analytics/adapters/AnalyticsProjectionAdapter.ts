import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { journeyStateService } from '@/modules/journey/services/JourneyStateService';
import { growthLoopStateService } from '@/modules/growth-loop/services/GrowthLoopStateService';
import type { AnalyticsCenter, Benchmark, BusinessHealthScore, AIInsight, NextBestAction } from '../businessTypes';
import { emitAnalyticsProjectionConsumed } from '../telemetry/analytics-telemetry';

export type AnalyticsProjection = {
  businessStateVersion: string;
  journeyVersion: string;
  growthLoopVersion: string;
  readiness: {
    value: number;
    stage: string;
    bottleneckCount: number;
  };
  progress: {
    value: number;
    stage: string;
    nextAction: {
      title: string;
      description: string;
      route?: string;
    };
  };
  growth: {
    value: number;
    health: string;
    recommendationCount: number;
  };
};

function healthLevel(value: number): BusinessHealthScore['level'] {
  if (value >= 70) return 'high';
  if (value >= 40) return 'medium';
  return 'low';
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function getAnalyticsProjection(userId: string, tenantId?: string): Promise<AnalyticsProjection> {
  const [businessState, journeyState, growthLoopState] = await Promise.all([
    businessStateService.getBusinessState(userId),
    journeyStateService.getJourneyState(userId),
    growthLoopStateService.getGrowthLoopState(userId),
  ]);

  const projection = {
    businessStateVersion: `${businessState.readiness.source}:${businessState.stage}:${businessState.readiness.percentage}`,
    journeyVersion: `${journeyState.source}:${journeyState.stage}:${journeyState.revenueProgress.completionPercent}`,
    growthLoopVersion: `${growthLoopState.source}:${growthLoopState.generatedAt}:${growthLoopState.overallScore}`,
    readiness: {
      value: clamp(businessState.readiness.percentage),
      stage: businessState.stage,
      bottleneckCount: businessState.bottlenecks.length,
    },
    progress: {
      value: clamp(journeyState.revenueProgress.completionPercent),
      stage: journeyState.stage,
      nextAction: {
        title: journeyState.nextAction.title,
        description: journeyState.nextAction.description,
        route: journeyState.nextAction.route,
      },
    },
    growth: {
      value: clamp(growthLoopState.overallScore),
      health: growthLoopState.health,
      recommendationCount: growthLoopState.recommendations.length,
    },
  };

  emitAnalyticsProjectionConsumed({
    userId,
    tenantId,
    businessStateVersion: projection.businessStateVersion,
    journeyVersion: projection.journeyVersion,
    growthLoopVersion: projection.growthLoopVersion,
  });

  return projection;
}

export function projectionToHealth(projection: AnalyticsProjection): BusinessHealthScore {
  const readiness = projection.readiness.value;

  return {
    overallScore: readiness,
    level: healthLevel(readiness),
    brandHealth: readiness,
    contentHealth: readiness,
    trafficHealth: readiness,
    funnelHealth: readiness,
    salesHealth: readiness,
    crmHealth: readiness,
    recommendations: [
      `Business State readiness: ${readiness}%.`,
      projection.readiness.bottleneckCount > 0
        ? `${projection.readiness.bottleneckCount} bottleneck(s) from Business State.`
        : 'No Business State bottlenecks detected.',
    ],
  };
}

export function projectionToInsights(projection: AnalyticsProjection): AIInsight[] {
  return [
    {
      id: 'business-state-readiness',
      insight: `Readiness is ${projection.readiness.value}% from Business State.`,
      impact: projection.readiness.value >= 70 ? 'medium' : 'high',
      category: 'business_state',
      action: projection.readiness.bottleneckCount > 0
        ? 'Resolve the highest-priority Business State bottleneck.'
        : 'Maintain current readiness and continue the journey plan.',
    },
    {
      id: 'journey-progress',
      insight: `Journey progress is ${projection.progress.value}% at ${projection.progress.stage}.`,
      impact: projection.progress.value >= 70 ? 'medium' : 'high',
      category: 'journey_state',
      action: projection.progress.nextAction.title,
    },
    {
      id: 'growth-loop',
      insight: `Growth Loop score is ${projection.growth.value}% (${projection.growth.health}).`,
      impact: projection.growth.value >= 70 ? 'medium' : 'high',
      category: 'growth_loop',
      action: projection.growth.recommendationCount > 0
        ? 'Review Growth Loop recommendations.'
        : 'Keep collecting growth signals.',
    },
  ];
}

export function projectionToActions(projection: AnalyticsProjection): NextBestAction[] {
  return [
    {
      id: 'journey-next-action',
      priority: 1,
      action: projection.progress.nextAction.title,
      reason: projection.progress.nextAction.description,
      impact: 'Advance Journey State progress',
    },
  ];
}

export function projectionToBenchmark(projection: AnalyticsProjection): Benchmark {
  const value = projection.growth.value;

  return {
    level: value >= 75 ? 'scale' : value >= 45 ? 'growth' : 'starter',
    requirements: [
      `Readiness: ${projection.readiness.value}%`,
      `Progress: ${projection.progress.value}%`,
      `Growth: ${projection.growth.value}%`,
    ],
    progress: value,
  };
}

export function applyProjectionToAnalyticsCenter(
  center: Omit<AnalyticsCenter, 'health' | 'insights' | 'actions' | 'benchmark'>,
  projection: AnalyticsProjection,
): AnalyticsCenter {
  return {
    ...center,
    health: projectionToHealth(projection),
    insights: projectionToInsights(projection),
    actions: projectionToActions(projection),
    benchmark: projectionToBenchmark(projection),
  };
}
