import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { BusinessBottleneck, BusinessStateDomain } from '@/modules/business-state/contracts/BusinessBottleneck';
import type { BusinessOpportunity } from '@/modules/business-state/contracts/BusinessOpportunity';
import type { ReadinessScore } from '@/modules/business-state/contracts/ReadinessScore';
import type {
  COORecommendation,
  COORecommendationDomain,
  COORecommendationPriority,
} from '../contracts/COORecommendation';

type BusinessHealthLevel = 'critical' | 'attention' | 'good' | 'excellent';

export type BusinessStateProjection = {
  source: 'business_state';
  health: {
    score: number;
    level: BusinessHealthLevel;
  };
  readiness: ReadinessScore;
  bottlenecks: BusinessBottleneck[];
  opportunities: BusinessOpportunity[];
  businessStage: BusinessState['stage'];
};

function healthLevel(readiness: number): BusinessHealthLevel {
  if (readiness >= 80) return 'excellent';
  if (readiness >= 60) return 'good';
  if (readiness >= 30) return 'attention';
  return 'critical';
}

function toDomain(domain: BusinessStateDomain): COORecommendationDomain {
  return domain;
}

function bottleneckPriority(severity: BusinessBottleneck['severity']): COORecommendationPriority {
  if (severity === 'high') return 'high';
  if (severity === 'medium') return 'medium';
  return 'low';
}

function opportunityPriority(impact: BusinessOpportunity['impact']): COORecommendationPriority {
  if (impact === 'high') return 'high';
  if (impact === 'medium') return 'medium';
  return 'low';
}

function routeForDomain(domain: COORecommendationDomain): string {
  switch (domain) {
    case 'brand':
      return '/brand-builder/profile';
    case 'content':
      return '/content-engine';
    case 'traffic':
      return '/traffic-engine';
    case 'funnel':
      return '/funnel-builder';
    case 'crm':
      return '/crm';
    case 'sales':
      return '/sales';
    case 'team':
      return '/team';
    case 'operations':
      return '/dashboard';
  }
}

export async function adaptBusinessStateProjection(userId: string): Promise<BusinessStateProjection> {
  const state = await businessStateService.getBusinessState(userId);

  return {
    source: 'business_state',
    health: {
      score: state.readiness.percentage,
      level: healthLevel(state.readiness.percentage),
    },
    readiness: state.readiness,
    bottlenecks: state.bottlenecks,
    opportunities: state.opportunities,
    businessStage: state.stage,
  };
}

export function mapBusinessStateProjectionToCOORecommendations(
  projection: BusinessStateProjection,
): COORecommendation[] {
  const bottleneckRecommendations: COORecommendation[] = projection.bottlenecks.slice(0, 3).map((bottleneck) => {
    const domain = toDomain(bottleneck.domain);

    return {
      source: 'business_state',
      scope: bottleneck.scope,
      confidence: bottleneck.confidence,
      fallback: bottleneck.fallback,
      recommendationSource: 'business_state',

      id: `business-bottleneck-${bottleneck.code}`,
      type: 'strategic',
      title: bottleneck.title,
      summary: bottleneck.description,
      domain,
      priority: bottleneckPriority(bottleneck.severity),
      horizon: bottleneck.severity === 'high' ? 'today' : 'week',
      reasoning: [
        `Business State stage: ${projection.businessStage}.`,
        `Readiness: ${projection.readiness.percentage}%.`,
        `Bottleneck source: ${bottleneck.source}.`,
      ],
      expectedOutcome: `Remove bottleneck: ${bottleneck.title}.`,
      supportingSignals: [
        `business-stage:${projection.businessStage}`,
        `readiness:${projection.readiness.percentage}`,
        `bottleneck:${bottleneck.code}`,
      ],
      relatedRoute: routeForDomain(domain),
    };
  });

  const opportunityRecommendations: COORecommendation[] = projection.opportunities.slice(0, 3).map((opportunity) => {
    const domain = toDomain(opportunity.domain);

    return {
      source: 'business_state',
      scope: opportunity.scope,
      confidence: opportunity.confidence,
      fallback: opportunity.fallback,
      recommendationSource: 'business_state',

      id: `business-opportunity-${opportunity.code}`,
      type: 'strategic',
      title: opportunity.title,
      summary: opportunity.description,
      domain,
      priority: opportunityPriority(opportunity.impact),
      horizon: opportunity.impact === 'high' ? 'week' : 'month',
      reasoning: [
        `Business State stage: ${projection.businessStage}.`,
        `Readiness: ${projection.readiness.percentage}%.`,
        `Opportunity source: ${opportunity.source}.`,
      ],
      expectedOutcome: `Capture opportunity: ${opportunity.title}.`,
      supportingSignals: [
        `business-stage:${projection.businessStage}`,
        `readiness:${projection.readiness.percentage}`,
        `opportunity:${opportunity.code}`,
      ],
      relatedRoute: routeForDomain(domain),
    };
  });

  const recommendations = [...bottleneckRecommendations, ...opportunityRecommendations];

  if (recommendations.length > 0) return recommendations;

  return [
    {
      source: 'business_state',
      scope: 'user',
      confidence: projection.readiness.confidence,
      fallback: projection.readiness.fallback,
      recommendationSource: 'business_state',

      id: `business-readiness-${projection.businessStage}`,
      type: 'strategic',
      title: 'Maintain business momentum',
      summary: `Business readiness is ${projection.readiness.percentage}%. Keep advancing the current stage.`,
      domain: 'operations',
      priority: projection.readiness.percentage < 60 ? 'medium' : 'low',
      horizon: 'week',
      reasoning: [
        `Business State stage: ${projection.businessStage}.`,
        `Business health: ${projection.health.level}.`,
      ],
      expectedOutcome: 'Keep the business operating plan aligned with canonical Business State.',
      supportingSignals: [
        `business-stage:${projection.businessStage}`,
        `readiness:${projection.readiness.percentage}`,
      ],
      relatedRoute: '/dashboard',
    },
  ];
}
