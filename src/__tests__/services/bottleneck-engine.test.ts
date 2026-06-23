import { describe, expect, it } from 'vitest';
import type { BusinessStateResult } from '@/modules/business-state/contracts/BusinessStateResult';
import { resolveBottleneck, signalFailureResult, type BottleneckSignals } from '@/modules/mission-engine/services/BottleneckEngine';
import type { BottleneckSeverity, MissionBottleneck } from '@/modules/mission-engine/contracts/MissionAuthority';

function state(overrides: Partial<BusinessStateResult> = {}): BusinessStateResult {
  return {
    currentState: 'LEAD_GENERATION',
    completedStates: ['BRAND_FOUNDATION', 'BRAND_POSITIONING', 'CONTENT_SYSTEM', 'LEAD_MAGNET', 'FUNNEL'],
    missingRequirements: ['Traffic Source Active', 'First Lead Generated'],
    nextState: 'SALES',
    readinessScore: 72,
    explainability: {
      completed: ['BRAND_FOUNDATION', 'BRAND_POSITIONING', 'CONTENT_SYSTEM', 'LEAD_MAGNET', 'FUNNEL'],
      missing: [
        { id: 'trafficSourceActive', label: 'Traffic Source Active', completed: false },
        { id: 'firstLeadGenerated', label: 'First Lead Generated', completed: false },
      ],
      reason: 'Lead generation has not been validated.',
    },
    ...overrides,
  };
}

const healthySignals: BottleneckSignals = {
  aiInterviewCompleted: true,
  businessContextExists: true,
  personalStoryLength: 140,
  targetAudienceExists: true,
  nicheSelected: true,
  audiencePainCount: 3,
  transformationStatementExists: true,
  positioningStatementExists: true,
  contentPillarCount: 3,
  contentDraftCount: 5,
  contentEngineEnabled: true,
  publishedContentCount: 5,
  engagementCount: 5,
  audienceSize: 500,
  leadMagnetExists: true,
  leadMagnetPublished: true,
  leadMagnetCtaExists: true,
  leadMagnetAssetExists: true,
  landingPagePublished: true,
  thankYouPagePublished: true,
  leadRouteExists: true,
  contactMethodExists: true,
  funnelTestPassed: true,
  trafficCount: 500,
  trafficTrend: 0,
  activeTrafficSourceCount: 1,
  leadCount: 30,
  leadGrowthRate: 0,
  leadConversionRate: 6,
  customerCount: 5,
  revenue: 1500,
  averageOrderValue: 300,
  customerLifetimeValue: 300,
  closeRate: 16,
  contentCount: 5,
  contentConsistency: 100,
  engagementRate: 100,
  offerExists: true,
  offerPublished: true,
  offerConversionRate: 6,
  salesWorkflowExists: true,
  repeatPurchaseCount: 2,
  retentionRate: 40,
  validationFailed: false,
  signalSourceAvailable: true,
  requiredMetricsResolved: true,
  sopCount: 3,
  activeAgentCount: 1,
  crmActivityCount: 3,
  agentActivityCount: 1,
  teamMemberCount: 1,
};

function expectBottleneck(input: {
  bottleneck: MissionBottleneck;
  severity: BottleneckSeverity;
  confidence: number;
  evidence: string[];
  state?: Partial<BusinessStateResult>;
  signals: Partial<BottleneckSignals>;
}) {
  const result = resolveBottleneck({
    businessState: state(input.state),
    signals: { ...healthySignals, ...input.signals },
  });

  expect(result.bottleneck).toBe(input.bottleneck);
  expect(result.severity).toBe(input.severity);
  expect(result.confidence).toBe(input.confidence);
  expect(result.evidence).toEqual(expect.arrayContaining(input.evidence));
  expect(result.explainability).toBe(`internal_diagnostic:${input.bottleneck}`);
}

describe('COO-002B Bottleneck Engine hardening', () => {
  it('returns BUSINESS_HEALTHY when all signals are available and no candidates are detected', () => {
    const result = resolveBottleneck({
      businessState: state({
        currentState: 'TEAM_BUILDING',
        completedStates: [
          'BRAND_FOUNDATION',
          'BRAND_POSITIONING',
          'CONTENT_SYSTEM',
          'LEAD_MAGNET',
          'FUNNEL',
          'LEAD_GENERATION',
          'SALES',
        ],
        missingRequirements: [],
        nextState: 'TEAM_BUILDING',
      }),
      signals: {
        ...healthySignals,
        trafficCount: 1000,
        leadCount: 200,
        customerCount: 50,
        revenue: 50000,
        averageOrderValue: 1000,
        customerLifetimeValue: 1000,
        closeRate: 25,
        retentionRate: 40,
        repeatPurchaseCount: 10,
        sopCount: 3,
        activeAgentCount: 1,
        teamMemberCount: 1,
      },
    });

    expect(result).toEqual({
      bottleneck: 'BUSINESS_HEALTHY',
      severity: 'None',
      confidence: 90,
      evidence: ['No active bottleneck candidates found.'],
      explainability: 'internal_diagnostic:BUSINESS_HEALTHY',
    });
  });

  it('covers NO_BRAND with live evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_BRAND',
      severity: 'Critical',
      confidence: 90,
      evidence: ['aiInterviewCompleted=false', 'personalStoryLength=42'],
      state: { currentState: 'BRAND_FOUNDATION' },
      signals: { aiInterviewCompleted: false, businessContextExists: false, personalStoryLength: 42, targetAudienceExists: false },
    });
  });

  it('covers NO_POSITIONING with live evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_POSITIONING',
      severity: 'Critical',
      confidence: 90,
      evidence: ['nicheSelected=false', 'audiencePainCount=1'],
      state: { currentState: 'BRAND_POSITIONING' },
      signals: { nicheSelected: false, audiencePainCount: 1, transformationStatementExists: false, positioningStatementExists: false },
    });
  });

  it('covers NO_CONTENT with live evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_CONTENT',
      severity: 'Critical',
      confidence: 90,
      evidence: ['contentPillarCount=1', 'contentDraftCount=2'],
      state: { currentState: 'CONTENT_SYSTEM' },
      signals: { contentPillarCount: 1, contentDraftCount: 2, contentEngineEnabled: false },
    });
  });

  it('covers NO_AUDIENCE with live evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_AUDIENCE',
      severity: 'High',
      confidence: 80,
      evidence: ['publishedContentCount=7', 'engagementCount=0', 'audienceSize=0'],
      state: { currentState: 'CONTENT_SYSTEM' },
      signals: { publishedContentCount: 7, engagementCount: 0, audienceSize: 0 },
    });
  });

  it('covers NO_LEAD_MAGNET with live evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_LEAD_MAGNET',
      severity: 'Critical',
      confidence: 90,
      evidence: ['leadMagnetExists=false', 'leadMagnetPublished=false'],
      state: { currentState: 'LEAD_MAGNET' },
      signals: { leadMagnetExists: false, leadMagnetPublished: false, leadMagnetCtaExists: false, leadMagnetAssetExists: false },
    });
  });

  it('covers NO_FUNNEL with live evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_FUNNEL',
      severity: 'Critical',
      confidence: 90,
      evidence: ['landingPagePublished=false', 'funnelTestPassed=false'],
      state: { currentState: 'FUNNEL' },
      signals: { landingPagePublished: false, thankYouPagePublished: false, leadRouteExists: false, contactMethodExists: false, funnelTestPassed: false },
    });
  });

  it('covers NO_TRAFFIC with live evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_TRAFFIC',
      severity: 'Critical',
      confidence: 90,
      evidence: ['activeTrafficSourceCount=0', 'trafficCount=0'],
      signals: { activeTrafficSourceCount: 0, trafficCount: 0, leadCount: 0, leadConversionRate: 0, customerCount: 0 },
    });
  });

  it('covers NO_LEADS with live evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_LEADS',
      severity: 'High',
      confidence: 80,
      evidence: ['trafficCount=150', 'leadCount=0', 'leadConversionRate=0%'],
      signals: { trafficCount: 150, leadCount: 0, leadConversionRate: 0, customerCount: 0 },
    });
  });

  it('covers NO_CONVERSION with live evidence when close rate is low but customers exist', () => {
    expectBottleneck({
      bottleneck: 'NO_CONVERSION',
      severity: 'High',
      confidence: 80,
      evidence: ['leadCount=120', 'customerCount=1', 'closeRate=1%'],
      state: { currentState: 'SALES' },
      signals: { leadCount: 120, leadConversionRate: 12, customerCount: 1, closeRate: 1 },
    });
  });

  it('covers NO_CUSTOMERS with live evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_CUSTOMERS',
      severity: 'High',
      confidence: 80,
      evidence: ['offerPublished=true', 'salesWorkflowExists=true', 'customerCount=0', 'leadCount=8'],
      state: { currentState: 'SALES' },
      signals: { leadCount: 8, leadConversionRate: 8, customerCount: 0, closeRate: 0, offerPublished: true, salesWorkflowExists: true },
    });
  });

  it('covers NO_RETENTION with live evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_RETENTION',
      severity: 'Medium',
      confidence: 65,
      evidence: ['customerCount=5', 'repeatPurchaseCount=0', 'retentionRate=0%'],
      state: { currentState: 'TEAM_BUILDING' },
      signals: { customerCount: 5, repeatPurchaseCount: 0, retentionRate: 0, revenue: 0 },
    });
  });

  it('covers NO_SYSTEM with canonical failure evidence', () => {
    const result = resolveBottleneck({
      businessState: state(),
      signals: { ...healthySignals, validationFailed: true },
    });

    expect(result).toMatchObject({
      bottleneck: 'NO_SYSTEM',
      severity: 'High',
      confidence: 80,
      evidence: ['Business signals unavailable.'],
      explainability: 'internal_diagnostic:NO_SYSTEM',
    });
  });

  it('covers NO_TEAM with live revenue and team evidence', () => {
    expectBottleneck({
      bottleneck: 'NO_TEAM',
      severity: 'Medium',
      confidence: 65,
      evidence: ['revenue=500', 'averageOrderValue=250', 'customerLifetimeValue=250', 'sopCount=1', 'activeAgentCount=0', 'teamMemberCount=0'],
      state: { currentState: 'TEAM_BUILDING' },
      signals: { revenue: 500, averageOrderValue: 250, customerLifetimeValue: 250, sopCount: 1, activeAgentCount: 0, teamMemberCount: 0, repeatPurchaseCount: 1 },
    });
  });

  it('returns the canonical failure response when signals are unavailable', () => {
    expect(signalFailureResult()).toMatchObject({
      bottleneck: 'NO_SYSTEM',
      severity: 'High',
      confidence: 80,
      evidence: ['Business signals unavailable.'],
      explainability: 'internal_diagnostic:NO_SYSTEM',
    });
  });
});
