import { getInterviewAuthority } from '@/modules/interview-authority/services/InterviewAuthorityService';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { BusinessState } from '../contracts/BusinessState';
import type { BusinessBottleneck } from '../contracts/BusinessBottleneck';
import type { BusinessOpportunity } from '../contracts/BusinessOpportunity';
import type { ReadinessScore } from '../contracts/ReadinessScore';
import type { BusinessStateAdapterResult } from './business-state-adapter-diagnostics';
import { createReadinessScore } from './business-state-adapter-diagnostics';
import { adaptCEOAdvisorState } from './CEOAdvisorStateAdapter';
import { adaptFunnelReadiness } from './FunnelReadinessAdapter';
import { adaptMissionStage } from './MissionStageAdapter';
import { adaptSocialReadiness } from './SocialReadinessAdapter';
import { adaptTrafficReadiness } from './TrafficReadinessAdapter';

const SEVERITY_RANK: Record<BusinessBottleneck['severity'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const IMPACT_RANK: Record<BusinessOpportunity['impact'], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function mergeByCode<T extends { code: string }>(items: T[]): T[] {
  const byCode = new Map<string, T>();
  for (const item of items) {
    if (!byCode.has(item.code)) byCode.set(item.code, item);
  }
  return [...byCode.values()];
}

function mergeReadiness(results: BusinessStateAdapterResult[]): ReadinessScore {
  const factualScores = results
    .filter((result) => result.source !== 'ceoAdvisorEngine')
    .map((result) => result.readiness)
    .filter((score): score is ReadinessScore => Boolean(score));

  if (factualScores.length === 0) {
    return createReadinessScore({
      source: 'BusinessStateAssembler',
      scope: 'user',
      confidence: 'fallback',
      fallback: 'no_readiness_sources',
    }, 0);
  }

  const percentage = Math.round(factualScores.reduce((sum, score) => sum + score.percentage, 0) / factualScores.length);
  const fallbackSources = factualScores.filter((score) => score.fallback !== 'none').map((score) => score.fallback);

  return {
    source: factualScores.map((score) => score.source).join('+'),
    scope: 'user',
    confidence: fallbackSources.length > 0 ? 'fallback' : 'derived',
    fallback: fallbackSources.length > 0 ? fallbackSources.join('+') : 'none',
    score: percentage,
    maxScore: 100,
    percentage,
  };
}

export async function assembleBusinessState(user: AuthUser): Promise<BusinessState> {
  const interviewAuthority = await getInterviewAuthority(user.id);
  const businessMode = interviewAuthority.businessContext.businessMode;
  const adapterResults = await Promise.all([
    adaptMissionStage(user),
    adaptFunnelReadiness(user.id, user.tenantId, businessMode),
    adaptSocialReadiness(user.id),
    adaptTrafficReadiness(user.id),
    adaptCEOAdvisorState(user.id, user.tenantId),
  ]);

  const stage = adapterResults.find((result) => result.stage)?.stage ?? 'foundation';
  const bottlenecks = mergeByCode(adapterResults.flatMap((result) => result.bottlenecks))
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const opportunities = mergeByCode(adapterResults.flatMap((result) => result.opportunities))
    .sort((a, b) => IMPACT_RANK[b.impact] - IMPACT_RANK[a.impact]);

  return {
    stage,
    readiness: mergeReadiness(adapterResults),
    bottlenecks,
    opportunities,
  };
}
