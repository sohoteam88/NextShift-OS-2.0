import type { TrafficPackage, TrafficReadiness } from '@/modules/traffic-engine/types';
import type { BusinessState } from '../contracts/BusinessState';

function levelFromScore(score: number): TrafficReadiness['level'] {
  if (score >= 75) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function trafficReadinessFromBusinessState(state: BusinessState): TrafficReadiness {
  const score = state.readiness.percentage;
  const trafficBottlenecks = state.bottlenecks.filter((item) => item.domain === 'traffic');
  const trafficOpportunities = state.opportunities.filter((item) => item.domain === 'traffic');

  return {
    score,
    level: levelFromScore(score),
    funnelReady: score,
    landingPageReady: score,
    thankYouReady: score,
    ctaReady: score,
    whatsappReady: score,
    leadMagnetReady: score,
    contentAssetsReady: score,
    trackingReady: score,
    missingItems: trafficBottlenecks.map((item) => item.description),
    recommendations: trafficOpportunities.map((item) => item.description),
  };
}

export function toTrafficReadinessViewModel(state: BusinessState): TrafficPackage | null {
  const trafficPackageMissing = state.bottlenecks.some((item) => item.code === 'traffic_package_missing');
  if (trafficPackageMissing) return null;

  const readiness = trafficReadinessFromBusinessState(state);
  const now = new Date().toISOString();

  return {
    goal: 'lead_generation',
    readiness,
    budget: {
      tier: 'starter',
      dailyBudget: '由流量策略生成后确认',
      monthlyBudget: '由流量策略生成后确认',
      expectedLeads: '由流量策略生成后确认',
      riskLevel: readiness.level === 'high' ? 'low' : readiness.level === 'medium' ? 'medium' : 'high',
    },
    campaign: {
      name: 'Business State Traffic Readiness',
      objective: 'lead_generation',
      platform: 'facebook',
      audience: '由流量策略生成后确认',
      creative: '由流量策略生成后确认',
      offer: '由流量策略生成后确认',
      cta: '由流量策略生成后确认',
      funnelDestination: '/traffic-engine',
      trackingNotes: 'Business State readiness projection',
      status: 'draft',
      budgetTier: 'starter',
      readinessScore: readiness.score,
    },
    checklist: readiness.missingItems.map((item, index) => ({
      id: `business-state-traffic-${index + 1}`,
      label: item,
      checked: false,
    })),
    analyticsConfig: {
      source: state.readiness.source,
      fallback: state.readiness.fallback,
    },
    status: 'draft',
    createdAt: now,
  };
}
