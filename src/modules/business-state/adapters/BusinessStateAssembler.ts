import prisma from '@/lib/prisma';
import { getInterviewAuthorityProjection } from '@/modules/interview-authority/services/interview-authority-service';
import type { BusinessMode } from '@/modules/interview-authority/contracts/BusinessContextSnapshot';
import type { InterviewAuthorityProjection } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { extractCheckKeys } from '@/modules/mission/utils/completed-checks';
import type { BusinessState } from '../contracts/BusinessState';
import type { BusinessBottleneck } from '../contracts/BusinessBottleneck';
import type { BusinessOpportunity } from '../contracts/BusinessOpportunity';
import type { BusinessStateResult } from '../contracts/BusinessStateResult';
import type { ReadinessScore } from '../contracts/ReadinessScore';
import type { BusinessStateAdapterResult } from './business-state-adapter-diagnostics';
import { createReadinessScore } from './business-state-adapter-diagnostics';
import { adaptCEOAdvisorState } from './CEOAdvisorStateAdapter';
import { adaptFunnelReadiness } from './FunnelReadinessAdapter';
import { adaptMissionStage } from './MissionStageAdapter';
import { adaptSocialReadiness } from './SocialReadinessAdapter';
import { adaptTrafficReadiness } from './TrafficReadinessAdapter';
import { resolveBusinessStateResult, type BusinessStateCapabilityFacts } from '../services/business-state-capability-engine';
import { BottleneckAuthority } from '@/modules/mission-engine/services/BottleneckAuthority';

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

function toFunnelBusinessMode(projection: InterviewAuthorityProjection): BusinessMode {
  if (projection.businessMode === 'team_building') return 'team_building';
  if (projection.businessMode === 'hybrid') return 'hybrid';
  return 'retail';
}

function hasAny(checks: Set<string>, values: string[]) {
  return values.some((value) => checks.has(value));
}

async function readCapabilityFacts(
  user: AuthUser,
  interviewAuthority: InterviewAuthorityProjection,
): Promise<BusinessStateCapabilityFacts> {
  const [progress, contentCount, publishedFunnel, leadCount, customerCount] = await Promise.all([
    prisma.userProgress.findUnique({
      where: { userId: user.id },
      select: { completedChecks: true },
    }),
    prisma.content.count({
      where: { ownerId: user.id, tenantId: user.tenantId },
    }),
    prisma.funnel.findFirst({
      where: {
        ownerId: user.id,
        tenantId: user.tenantId,
        OR: [
          { status: 'published' },
          { publishedAt: { not: null } },
          { conversions: { gt: 0 } },
        ],
      },
      select: { id: true },
    }),
    prisma.lead.count({
      where: { ownerId: user.id, tenantId: user.tenantId, deletedAt: null },
    }),
    prisma.customer.count({
      where: { ownerId: user.id, tenantId: user.tenantId },
    }),
  ]);
  const completedChecks = extractCheckKeys(progress?.completedChecks);
  const checks = new Set(completedChecks);
  const interviewCompleted = checks.has('brand_discovery_completed');
  const brandPositioned = hasAny(checks, ['brand_dna_confirmed', 'positioning_completed']);
  const contentCreated = hasAny(checks, ['first_content_generated', 'content_published']) || contentCount > 0;
  const leadMagnetReady = checks.has('lead_magnet_created');
  const funnelReady = Boolean(publishedFunnel) || hasAny(checks, ['funnel_published', 'lead_flow_tested']);
  const trafficReady = hasAny(checks, ['traffic_campaign_launched', 'campaign_launched']);
  const firstCustomer = checks.has('first_sale_completed') || customerCount > 0;

  return {
    completedChecks,
    interviewCompleted,
    businessContextCreated: interviewCompleted || interviewAuthority.fallback === 'none',
    personalStoryCaptured: interviewCompleted || interviewAuthority.personalStoryVector.length > 0,
    targetAudienceDefined: interviewAuthority.audienceStatus === 'defined' || interviewCompleted,
    nicheSelected: brandPositioned,
    audiencePainDefined: brandPositioned || interviewAuthority.audienceStatus === 'defined',
    transformationDefined: brandPositioned,
    offerDirectionDefined: brandPositioned || interviewAuthority.offerStatus === 'defined',
    contentPillarsCreated: contentCreated || brandPositioned,
    contentCalendarGenerated: contentCreated || checks.has('content_calendar_generated'),
    minimumContentAssetsCreated: contentCreated,
    contentEngineActivated: contentCreated,
    leadMagnetCreated: leadMagnetReady,
    leadMagnetPublished: leadMagnetReady,
    leadMagnetCtaActive: leadMagnetReady,
    landingPageCreated: funnelReady,
    thankYouPageCreated: funnelReady,
    ctaRoutingActive: funnelReady,
    leadFlowTested: funnelReady,
    leadSourceActive: funnelReady || leadCount > 0,
    trafficSourceActive: trafficReady,
    firstLeadGenerated: leadCount > 0,
    leadExists: leadCount > 0,
    offerExists: brandPositioned || interviewAuthority.offerStatus === 'defined',
    salesProcessExists: hasAny(checks, ['crm_active', 'whatsapp_ai_configured', 'whatsapp_followup_configured']),
    firstCustomerAcquired: firstCustomer,
    revenueExists: firstCustomer || interviewAuthority.revenueStatus === 'started',
    processDocumented: hasAny(checks, ['growth_mode_active', 'process_documented']),
    delegationReady: hasAny(checks, ['growth_mode_active', 'delegation_ready']),
    agentWorkforceActive: hasAny(checks, ['content_agent_activated', 'lead_magnet_agent_activated', 'funnel_agent_activated', 'agent_completed_work']),
    humanTeamAdded: hasAny(checks, ['human_team_added', 'team_member_added', 'growth_mode_active']),
  };
}

export async function assembleBusinessState(user: AuthUser): Promise<BusinessState> {
  const interviewAuthority = await getInterviewAuthorityProjection(user.id);
  const businessMode = toFunnelBusinessMode(interviewAuthority);
  const [capabilityFacts, ...adapterResults] = await Promise.all([
    readCapabilityFacts(user, interviewAuthority),
    adaptMissionStage(user),
    adaptFunnelReadiness(user.id, user.tenantId, businessMode),
    adaptSocialReadiness(user.id),
    adaptTrafficReadiness(user.id),
    adaptCEOAdvisorState(user.id, user.tenantId),
  ]);
  const stateResult = resolveBusinessStateResult(capabilityFacts);

  const stage = adapterResults.find((result) => result.stage)?.stage ?? 'foundation';
  const bottlenecks = mergeByCode([BottleneckAuthority.toBusinessBottleneck(stateResult), ...adapterResults.flatMap((result) => result.bottlenecks)])
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  const opportunities = mergeByCode(adapterResults.flatMap((result) => result.opportunities))
    .sort((a, b) => IMPACT_RANK[b.impact] - IMPACT_RANK[a.impact]);

  return {
    stage,
    readiness: mergeReadiness(adapterResults),
    bottlenecks,
    opportunities,
    stateResult,
  };
}
