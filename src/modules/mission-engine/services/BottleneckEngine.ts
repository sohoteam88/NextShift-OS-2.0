import prisma from '@/lib/prisma';
import { extractCheckKeys } from '@/modules/mission/utils/completed-checks';
import type { BusinessStateResult } from '@/modules/business-state/contracts/BusinessStateResult';
import type {
  BottleneckResult,
  BottleneckSeverity,
  MissionBottleneck,
} from '../contracts/MissionAuthority';

export type BottleneckSignals = {
  aiInterviewCompleted: boolean;
  businessContextExists: boolean;
  personalStoryLength: number;
  targetAudienceExists: boolean;
  nicheSelected: boolean;
  audiencePainCount: number;
  transformationStatementExists: boolean;
  positioningStatementExists: boolean;
  contentPillarCount: number;
  contentDraftCount: number;
  contentEngineEnabled: boolean;
  publishedContentCount: number;
  engagementCount: number;
  audienceSize: number;
  leadMagnetExists: boolean;
  leadMagnetPublished: boolean;
  leadMagnetCtaExists: boolean;
  leadMagnetAssetExists: boolean;
  landingPagePublished: boolean;
  thankYouPagePublished: boolean;
  leadRouteExists: boolean;
  contactMethodExists: boolean;
  funnelTestPassed: boolean;
  trafficCount: number;
  trafficTrend: number;
  activeTrafficSourceCount: number;
  leadCount: number;
  leadGrowthRate: number;
  leadConversionRate: number;
  customerCount: number;
  revenue: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  closeRate: number;
  contentCount: number;
  contentConsistency: number;
  engagementRate: number;
  offerExists: boolean;
  offerPublished: boolean;
  offerConversionRate: number;
  salesWorkflowExists: boolean;
  repeatPurchaseCount: number;
  retentionRate: number;
  validationFailed: boolean;
  signalSourceAvailable: boolean;
  requiredMetricsResolved: boolean;
  sopCount: number;
  activeAgentCount: number;
  crmActivityCount: number;
  agentActivityCount: number;
  teamMemberCount: number;
};

type BottleneckCandidate = {
  bottleneck: MissionBottleneck;
  severity: BottleneckSeverity;
  evidence: string[];
  explainability: string;
  stateRelevance: number;
  revenueProximity: number;
  defaultOrder: number;
};

const SEVERITY_WEIGHT: Record<BottleneckSeverity, number> = {
  Critical: 100,
  High: 50,
  Medium: 20,
  None: 0,
};

const STATE_RELEVANCE: Record<BusinessStateResult['currentState'], Partial<Record<MissionBottleneck, number>>> = {
  BRAND_FOUNDATION: { NO_BRAND: 100, NO_AUDIENCE: 80, NO_POSITIONING: 70 },
  BRAND_POSITIONING: { NO_POSITIONING: 100, NO_AUDIENCE: 90, NO_CONTENT: 60 },
  CONTENT_SYSTEM: { NO_CONTENT: 100, NO_AUDIENCE: 80, NO_LEAD_MAGNET: 70 },
  LEAD_MAGNET: { NO_LEAD_MAGNET: 100, NO_AUDIENCE: 80, NO_FUNNEL: 70 },
  FUNNEL: { NO_FUNNEL: 100, NO_LEADS: 90, NO_TRAFFIC: 80 },
  LEAD_GENERATION: { NO_TRAFFIC: 100, NO_LEADS: 100, NO_AUDIENCE: 80, NO_CONVERSION: 70 },
  SALES: { NO_CONVERSION: 100, NO_CUSTOMERS: 90, NO_LEADS: 80, NO_RETENTION: 60 },
  TEAM_BUILDING: { NO_TEAM: 100, NO_SYSTEM: 90, NO_RETENTION: 70 },
};

const REVENUE_PROXIMITY_ORDER: MissionBottleneck[] = [
  'NO_CONVERSION',
  'NO_CUSTOMERS',
  'NO_RETENTION',
  'NO_LEADS',
  'NO_TRAFFIC',
  'NO_FUNNEL',
  'NO_LEAD_MAGNET',
  'NO_AUDIENCE',
  'NO_CONTENT',
  'NO_POSITIONING',
  'NO_BRAND',
  'BUSINESS_HEALTHY',
  'NO_SYSTEM',
  'NO_TEAM',
];

const DEFAULT_STATE_ORDER: MissionBottleneck[] = [
  'NO_BRAND',
  'NO_POSITIONING',
  'NO_CONTENT',
  'NO_AUDIENCE',
  'NO_LEAD_MAGNET',
  'NO_FUNNEL',
  'NO_TRAFFIC',
  'NO_LEADS',
  'NO_CONVERSION',
  'NO_CUSTOMERS',
  'NO_RETENTION',
  'BUSINESS_HEALTHY',
  'NO_SYSTEM',
  'NO_TEAM',
];

const EMPTY_SIGNALS: BottleneckSignals = {
  aiInterviewCompleted: true,
  businessContextExists: true,
  personalStoryLength: 100,
  targetAudienceExists: true,
  nicheSelected: true,
  audiencePainCount: 3,
  transformationStatementExists: true,
  positioningStatementExists: true,
  contentPillarCount: 3,
  contentDraftCount: 5,
  contentEngineEnabled: true,
  publishedContentCount: 0,
  engagementCount: 1,
  audienceSize: 1,
  leadMagnetExists: true,
  leadMagnetPublished: true,
  leadMagnetCtaExists: true,
  leadMagnetAssetExists: true,
  landingPagePublished: true,
  thankYouPagePublished: true,
  leadRouteExists: true,
  contactMethodExists: true,
  funnelTestPassed: true,
  trafficCount: 0,
  trafficTrend: 0,
  activeTrafficSourceCount: 0,
  leadCount: 0,
  leadGrowthRate: 0,
  leadConversionRate: 0,
  customerCount: 0,
  revenue: 0,
  averageOrderValue: 0,
  customerLifetimeValue: 0,
  closeRate: 0,
  contentCount: 0,
  contentConsistency: 0,
  engagementRate: 0,
  offerExists: false,
  offerPublished: false,
  offerConversionRate: 0,
  salesWorkflowExists: true,
  repeatPurchaseCount: 1,
  retentionRate: 100,
  validationFailed: false,
  signalSourceAvailable: true,
  requiredMetricsResolved: true,
  sopCount: 3,
  activeAgentCount: 1,
  crmActivityCount: 0,
  agentActivityCount: 0,
  teamMemberCount: 0,
};

function relevanceFor(state: BusinessStateResult, bottleneck: MissionBottleneck) {
  return STATE_RELEVANCE[state.currentState][bottleneck] ?? 0;
}

function revenueProximityFor(bottleneck: MissionBottleneck) {
  const index = REVENUE_PROXIMITY_ORDER.indexOf(bottleneck);
  return index >= 0 ? REVENUE_PROXIMITY_ORDER.length - index : 0;
}

function defaultOrderFor(bottleneck: MissionBottleneck) {
  const index = DEFAULT_STATE_ORDER.indexOf(bottleneck);
  return index >= 0 ? DEFAULT_STATE_ORDER.length - index : 0;
}

function internalDiagnosticFor(bottleneck: MissionBottleneck) {
  return `internal_diagnostic:${bottleneck}`;
}

function candidate(input: {
  state: BusinessStateResult;
  bottleneck: MissionBottleneck;
  severity: BottleneckSeverity;
  evidence: string[];
}): BottleneckCandidate {
  return {
    ...input,
    explainability: internalDiagnosticFor(input.bottleneck),
    stateRelevance: relevanceFor(input.state, input.bottleneck),
    revenueProximity: revenueProximityFor(input.bottleneck),
    defaultOrder: defaultOrderFor(input.bottleneck),
  };
}

function rankCandidates(candidates: BottleneckCandidate[]) {
  return [...candidates].sort((a, b) => {
    const severityDelta = SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
    if (severityDelta !== 0) return severityDelta;
    const relevanceDelta = b.stateRelevance - a.stateRelevance;
    if (relevanceDelta !== 0) return relevanceDelta;
    const revenueDelta = b.revenueProximity - a.revenueProximity;
    if (revenueDelta !== 0) return revenueDelta;
    return b.defaultOrder - a.defaultOrder;
  });
}

function confidenceFor(candidate: BottleneckCandidate) {
  if (candidate.bottleneck === 'BUSINESS_HEALTHY') return 90;
  if (candidate.evidence.length === 0) return 40;
  if (candidate.severity === 'Critical') return 90;
  if (candidate.severity === 'High') return 80;
  return 65;
}

function resultFromCandidate(candidate: BottleneckCandidate): BottleneckResult {
  return {
    bottleneck: candidate.bottleneck,
    confidence: confidenceFor(candidate),
    evidence: candidate.evidence,
    severity: candidate.severity,
    explainability: candidate.explainability,
  };
}

function healthyBusinessCandidate(state: BusinessStateResult): BottleneckCandidate {
  return candidate({
    state,
    bottleneck: 'BUSINESS_HEALTHY',
    severity: 'None',
    evidence: ['No active bottleneck candidates found.'],
  });
}

export function signalFailureResult(): BottleneckResult {
  return {
    bottleneck: 'NO_SYSTEM',
    confidence: 80,
    evidence: ['Business signals unavailable.'],
    severity: 'High',
    explainability: internalDiagnosticFor('NO_SYSTEM'),
  };
}

export function resolveBottleneck(input: {
  businessState: BusinessStateResult;
  signals?: Partial<BottleneckSignals>;
}): BottleneckResult {
  const state = input.businessState;
  const signals: BottleneckSignals = { ...EMPTY_SIGNALS, ...input.signals };
  const candidates: BottleneckCandidate[] = [];

  if (signals.validationFailed || !signals.signalSourceAvailable || !signals.requiredMetricsResolved) {
    return signalFailureResult();
  }

  if (
    !signals.aiInterviewCompleted
    || !signals.businessContextExists
    || signals.personalStoryLength < 100
    || !signals.targetAudienceExists
  ) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_BRAND',
      severity: 'Critical',
      evidence: [
        `aiInterviewCompleted=${signals.aiInterviewCompleted}`,
        `businessContextExists=${signals.businessContextExists}`,
        `personalStoryLength=${signals.personalStoryLength}`,
        `targetAudienceExists=${signals.targetAudienceExists}`,
      ],
    }));
  }

  if (
    !signals.nicheSelected
    || signals.audiencePainCount < 3
    || !signals.transformationStatementExists
    || !signals.positioningStatementExists
  ) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_POSITIONING',
      severity: 'Critical',
      evidence: [
        `nicheSelected=${signals.nicheSelected}`,
        `audiencePainCount=${signals.audiencePainCount}`,
        `transformationStatementExists=${signals.transformationStatementExists}`,
        `positioningStatementExists=${signals.positioningStatementExists}`,
      ],
    }));
  }

  if (signals.contentPillarCount < 3 || signals.contentDraftCount < 5 || !signals.contentEngineEnabled) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_CONTENT',
      severity: 'Critical',
      evidence: [
        `contentPillarCount=${signals.contentPillarCount}`,
        `contentDraftCount=${signals.contentDraftCount}`,
        `contentEngineEnabled=${signals.contentEngineEnabled}`,
      ],
    }));
  }

  if ((signals.publishedContentCount >= 5 && signals.engagementCount === 0) || signals.audienceSize === 0) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_AUDIENCE',
      severity: 'High',
      evidence: [
        `publishedContentCount=${signals.publishedContentCount}`,
        `engagementCount=${signals.engagementCount}`,
        `audienceSize=${signals.audienceSize}`,
      ],
    }));
  }

  if (
    !signals.leadMagnetExists
    || !signals.leadMagnetPublished
    || !signals.leadMagnetCtaExists
    || !signals.leadMagnetAssetExists
  ) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_LEAD_MAGNET',
      severity: 'Critical',
      evidence: [
        `leadMagnetExists=${signals.leadMagnetExists}`,
        `leadMagnetPublished=${signals.leadMagnetPublished}`,
        `leadMagnetCtaExists=${signals.leadMagnetCtaExists}`,
        `leadMagnetAssetExists=${signals.leadMagnetAssetExists}`,
      ],
    }));
  }

  if (
    !signals.landingPagePublished
    || !signals.thankYouPagePublished
    || !signals.leadRouteExists
    || !signals.contactMethodExists
    || !signals.funnelTestPassed
  ) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_FUNNEL',
      severity: 'Critical',
      evidence: [
        `landingPagePublished=${signals.landingPagePublished}`,
        `thankYouPagePublished=${signals.thankYouPagePublished}`,
        `leadRouteExists=${signals.leadRouteExists}`,
        `contactMethodExists=${signals.contactMethodExists}`,
        `funnelTestPassed=${signals.funnelTestPassed}`,
      ],
    }));
  }

  if (signals.activeTrafficSourceCount === 0 || signals.trafficCount === 0) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_TRAFFIC',
      severity: 'Critical',
      evidence: [`activeTrafficSourceCount=${signals.activeTrafficSourceCount}`, `trafficCount=${signals.trafficCount}`],
    }));
  }

  if (
    (signals.trafficCount >= 100 && signals.leadCount === 0)
    || (signals.leadConversionRate < 1 && signals.trafficCount >= 100)
  ) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_LEADS',
      severity: 'High',
      evidence: [
        `trafficCount=${signals.trafficCount}`,
        `leadCount=${signals.leadCount}`,
        `leadConversionRate=${signals.leadConversionRate}%`,
      ],
    }));
  }

  if (
    (signals.leadCount >= 20 && signals.customerCount === 0)
    || (signals.closeRate < 2 && signals.leadCount >= 20)
  ) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_CONVERSION',
      severity: 'High',
      evidence: [`leadCount=${signals.leadCount}`, `customerCount=${signals.customerCount}`, `closeRate=${signals.closeRate}%`],
    }));
  }

  if (
    signals.offerPublished
    && signals.salesWorkflowExists
    && signals.customerCount === 0
    && signals.leadCount > 0
  ) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_CUSTOMERS',
      severity: 'High',
      evidence: [
        `offerPublished=${signals.offerPublished}`,
        `salesWorkflowExists=${signals.salesWorkflowExists}`,
        `customerCount=${signals.customerCount}`,
        `leadCount=${signals.leadCount}`,
      ],
    }));
  }

  if (
    (signals.customerCount >= 3 && signals.repeatPurchaseCount === 0)
    || (signals.retentionRate < 20 && signals.customerCount >= 3)
  ) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_RETENTION',
      severity: 'Medium',
      evidence: [
        `customerCount=${signals.customerCount}`,
        `repeatPurchaseCount=${signals.repeatPurchaseCount}`,
        `retentionRate=${signals.retentionRate}%`,
      ],
    }));
  }

  if (
    (signals.revenue > 0 && signals.sopCount < 3)
    || (signals.revenue > 0 && signals.activeAgentCount === 0 && signals.teamMemberCount === 0)
  ) {
    candidates.push(candidate({
      state,
      bottleneck: 'NO_TEAM',
      severity: 'Medium',
      evidence: [
        `revenue=${signals.revenue}`,
        `averageOrderValue=${signals.averageOrderValue}`,
        `customerLifetimeValue=${signals.customerLifetimeValue}`,
        `sopCount=${signals.sopCount}`,
        `activeAgentCount=${signals.activeAgentCount}`,
        `teamMemberCount=${signals.teamMemberCount}`,
      ],
    }));
  }

  const ranked = rankCandidates(candidates);
  return resultFromCandidate(ranked[0] ?? healthyBusinessCandidate(state));
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function numberFromMetadata(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function revenueFromCustomerMetadata(metadata: unknown) {
  const record = metadataRecord(metadata);
  return numberFromMetadata(record.revenue)
    + numberFromMetadata(record.amount)
    + numberFromMetadata(record.value)
    + numberFromMetadata(record.purchaseAmount);
}

function customerIdentity(customer: { leadId: string | null; email: string | null; phone: string | null; name: string }) {
  return customer.leadId ?? customer.email ?? customer.phone ?? customer.name;
}

export async function readBottleneckSignals(userId: string): Promise<{ businessStateUser: { id: string; tenantId: string }; signals: BottleneckSignals }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true },
  });

  if (!user) throw new Error('User not found');

  const recentWindow = new Date();
  recentWindow.setDate(recentWindow.getDate() - 30);

  const [
    progress,
    leadCount,
    customers,
    contentCount,
    publishedContentCount,
    postPerformance,
    funnelAggregates,
    publishedFunnelCount,
    crmActivityCount,
    agentActivityCount,
    teamMemberCount,
  ] = await Promise.all([
    prisma.userProgress.findUnique({
      where: { userId: user.id },
      select: { completedChecks: true },
    }),
    prisma.lead.count({ where: { tenantId: user.tenantId, ownerId: user.id, deletedAt: null } }),
    prisma.customer.findMany({
      where: { tenantId: user.tenantId, ownerId: user.id },
      select: {
        leadId: true,
        email: true,
        phone: true,
        name: true,
        metadata: true,
      },
      take: 1000,
    }),
    prisma.content.count({ where: { tenantId: user.tenantId, ownerId: user.id } }),
    prisma.content.count({ where: { tenantId: user.tenantId, ownerId: user.id, status: 'published' } }),
    prisma.postPerformance.aggregate({
      where: { tenantId: user.tenantId, userId: user.id },
      _sum: { reach: true, impressions: true, likes: true, comments: true, shares: true, saves: true, clicks: true },
    }),
    prisma.funnel.aggregate({
      where: { tenantId: user.tenantId, ownerId: user.id },
      _sum: { views: true, conversions: true },
    }),
    prisma.funnel.count({
      where: {
        tenantId: user.tenantId,
        ownerId: user.id,
        OR: [{ status: 'published' }, { publishedAt: { not: null } }],
      },
    }),
    prisma.activity.count({
      where: { tenantId: user.tenantId, userId: user.id, createdAt: { gte: recentWindow } },
    }),
    prisma.aIUsageLog.count({
      where: { tenantId: user.tenantId, userId: user.id, createdAt: { gte: recentWindow } },
    }),
    prisma.user.count({ where: { tenantId: user.tenantId, sponsorId: user.id, deletedAt: null } }),
  ]);

  const completedChecks = new Set(extractCheckKeys(progress?.completedChecks));
  const customerCount = customers.length;
  const revenue = customers.reduce((sum, customer) => sum + revenueFromCustomerMetadata(customer.metadata), 0);
  const customerPurchaseCounts = new Map<string, number>();
  for (const customer of customers) {
    const identity = customerIdentity(customer);
    customerPurchaseCounts.set(identity, (customerPurchaseCounts.get(identity) ?? 0) + 1);
  }
  const repeatPurchaseCount = [...customerPurchaseCounts.values()].reduce((sum, count) => sum + Math.max(count - 1, 0), 0);
  const retainedCustomerCount = [...customerPurchaseCounts.values()].filter((count) => count > 1).length;
  const retentionRate = customerCount > 0 ? Math.round((retainedCustomerCount / customerCount) * 100) : 0;
  const averageOrderValue = customerCount > 0 ? Math.round(revenue / customerCount) : 0;
  const customerLifetimeValue = customerPurchaseCounts.size > 0 ? Math.round(revenue / customerPurchaseCounts.size) : 0;
  const trafficCount = funnelAggregates._sum.views ?? 0;
  const funnelConversions = funnelAggregates._sum.conversions ?? 0;
  const engagementCount =
    (postPerformance._sum.likes ?? 0)
    + (postPerformance._sum.comments ?? 0)
    + (postPerformance._sum.shares ?? 0)
    + (postPerformance._sum.saves ?? 0)
    + (postPerformance._sum.clicks ?? 0);
  const audienceSize = Math.max(postPerformance._sum.reach ?? 0, postPerformance._sum.impressions ?? 0, trafficCount);
  const brandReady = completedChecks.has('brand_discovery_completed');
  const positioningReady = completedChecks.has('brand_dna_confirmed') || completedChecks.has('positioning_completed');
  const leadMagnetReady = completedChecks.has('lead_magnet_created');
  const funnelReady = completedChecks.has('funnel_published') || publishedFunnelCount > 0 || funnelConversions > 0;
  const salesWorkflowExists = completedChecks.has('crm_setup_completed') || completedChecks.has('whatsapp_followup_configured') || crmActivityCount > 0;

  return {
    businessStateUser: user,
    signals: {
      aiInterviewCompleted: brandReady,
      businessContextExists: brandReady,
      personalStoryLength: brandReady ? 100 : 0,
      targetAudienceExists: brandReady,
      nicheSelected: positioningReady,
      audiencePainCount: positioningReady ? 3 : 0,
      transformationStatementExists: positioningReady,
      positioningStatementExists: positioningReady,
      contentPillarCount: positioningReady ? 3 : 0,
      contentDraftCount: contentCount,
      contentEngineEnabled: completedChecks.has('first_content_generated') || contentCount > 0,
      publishedContentCount,
      engagementCount,
      audienceSize,
      leadMagnetExists: leadMagnetReady,
      leadMagnetPublished: leadMagnetReady,
      leadMagnetCtaExists: leadMagnetReady,
      leadMagnetAssetExists: leadMagnetReady,
      landingPagePublished: funnelReady,
      thankYouPagePublished: funnelReady,
      leadRouteExists: funnelReady,
      contactMethodExists: funnelReady || salesWorkflowExists,
      funnelTestPassed: funnelReady,
      trafficCount,
      trafficTrend: 0,
      activeTrafficSourceCount: trafficCount > 0 ? 1 : 0,
      leadCount,
      leadGrowthRate: 0,
      leadConversionRate: trafficCount > 0 ? Math.round((leadCount / trafficCount) * 100) : 0,
      customerCount,
      revenue,
      averageOrderValue,
      customerLifetimeValue,
      closeRate: leadCount > 0 ? Math.round((customerCount / leadCount) * 100) : 0,
      contentCount,
      contentConsistency: contentCount >= 3 ? 100 : contentCount > 0 ? 40 : 0,
      engagementRate: publishedContentCount > 0 ? Math.round((engagementCount / publishedContentCount) * 100) : 0,
      offerExists: leadMagnetReady || publishedFunnelCount > 0,
      offerPublished: funnelReady,
      offerConversionRate: trafficCount > 0 ? Math.round((funnelConversions / trafficCount) * 100) : 0,
      salesWorkflowExists,
      repeatPurchaseCount,
      retentionRate,
      validationFailed: false,
      signalSourceAvailable: true,
      requiredMetricsResolved: true,
      sopCount: completedChecks.has('process_documented') ? 3 : 0,
      activeAgentCount: agentActivityCount > 0 ? 1 : 0,
      crmActivityCount,
      agentActivityCount,
      teamMemberCount,
    },
  };
}

export const bottleneckEngine = {
  async getBottleneck(userId: string, businessState: BusinessStateResult): Promise<BottleneckResult> {
    try {
      const { signals } = await readBottleneckSignals(userId);
      return resolveBottleneck({ businessState, signals });
    } catch {
      return signalFailureResult();
    }
  },
};
