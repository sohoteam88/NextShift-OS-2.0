import type { BusinessState } from '../contracts/BusinessState';

export type FunnelHealthViewModel = {
  overall: number;
  breakdown: {
    completeness: number;
    real_material_used: number;
    diversity: number;
    cta_consistency: number;
    performance: number | null;
  };
  status: 'excellent' | 'good' | 'needs_attention' | 'critical';
  next_best_action: {
    action: string;
    reason: string;
    route: string;
  };
  business_state: {
    source: string;
    fallback: string | 'none';
  };
};

function statusFromScore(score: number): FunnelHealthViewModel['status'] {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'needs_attention';
  return 'critical';
}

export function toFunnelHealthViewModel(state: BusinessState): FunnelHealthViewModel {
  const score = state.readiness.percentage;
  const funnelBottleneck = state.bottlenecks.find((item) => item.domain === 'funnel');

  return {
    overall: score,
    breakdown: {
      completeness: score,
      real_material_used: score,
      diversity: score,
      cta_consistency: score,
      performance: null,
    },
    status: statusFromScore(score),
    next_best_action: {
      action: funnelBottleneck ? 'Review funnel readiness gap' : 'Review funnel readiness',
      reason: funnelBottleneck?.description ?? 'Business State did not identify a funnel-specific blocker.',
      route: '/funnel',
    },
    business_state: {
      source: state.readiness.source,
      fallback: state.readiness.fallback,
    },
  };
}
