import { describe, expect, it } from 'vitest';
import {
  resolveBusinessStateResult,
  type BusinessStateCapabilityFacts,
} from '@/modules/business-state/services/business-state-capability-engine';

function facts(overrides: Partial<BusinessStateCapabilityFacts> = {}): BusinessStateCapabilityFacts {
  return {
    completedChecks: [],
    interviewCompleted: false,
    businessContextCreated: false,
    personalStoryCaptured: false,
    targetAudienceDefined: false,
    nicheSelected: false,
    audiencePainDefined: false,
    transformationDefined: false,
    offerDirectionDefined: false,
    contentPillarsCreated: false,
    contentCalendarGenerated: false,
    minimumContentAssetsCreated: false,
    contentEngineActivated: false,
    leadMagnetCreated: false,
    leadMagnetPublished: false,
    leadMagnetCtaActive: false,
    landingPageCreated: false,
    thankYouPageCreated: false,
    ctaRoutingActive: false,
    leadFlowTested: false,
    leadSourceActive: false,
    trafficSourceActive: false,
    firstLeadGenerated: false,
    leadExists: false,
    offerExists: false,
    salesProcessExists: false,
    firstCustomerAcquired: false,
    revenueExists: false,
    processDocumented: false,
    delegationReady: false,
    agentWorkforceActive: false,
    humanTeamAdded: false,
    ...overrides,
  };
}

describe('COO-001 business state capability engine', () => {
  it('defaults no-data users to BRAND_FOUNDATION without unknown/null state', () => {
    const result = resolveBusinessStateResult(facts());

    expect(result.currentState).toBe('BRAND_FOUNDATION');
    expect(result.nextState).toBe('BRAND_POSITIONING');
    expect(result.missingRequirements).toContain('AI Interview Completed');
    expect(result.explainability.reason).toContain('Business profile incomplete');
    expect(result.currentState).not.toBe('UNKNOWN');
  });

  it('uses the lowest incomplete state instead of activity volume', () => {
    const result = resolveBusinessStateResult(facts({
      interviewCompleted: true,
      businessContextCreated: true,
      personalStoryCaptured: true,
      targetAudienceDefined: true,
      nicheSelected: true,
      audiencePainDefined: true,
      transformationDefined: true,
      offerDirectionDefined: true,
      contentPillarsCreated: true,
      contentCalendarGenerated: true,
      minimumContentAssetsCreated: true,
      contentEngineActivated: true,
      firstLeadGenerated: true,
      leadExists: true,
    }));

    expect(result.completedStates).toEqual(['BRAND_FOUNDATION', 'BRAND_POSITIONING', 'CONTENT_SYSTEM']);
    expect(result.currentState).toBe('LEAD_MAGNET');
    expect(result.missingRequirements).toEqual([
      'Lead Magnet Created',
      'Lead Magnet Published',
      'Lead Magnet CTA Active',
    ]);
  });

  it('moves to LEAD_GENERATION only after funnel capability is complete', () => {
    const result = resolveBusinessStateResult(facts({
      interviewCompleted: true,
      businessContextCreated: true,
      personalStoryCaptured: true,
      targetAudienceDefined: true,
      nicheSelected: true,
      audiencePainDefined: true,
      transformationDefined: true,
      offerDirectionDefined: true,
      contentPillarsCreated: true,
      contentCalendarGenerated: true,
      minimumContentAssetsCreated: true,
      contentEngineActivated: true,
      leadMagnetCreated: true,
      leadMagnetPublished: true,
      leadMagnetCtaActive: true,
      landingPageCreated: true,
      thankYouPageCreated: true,
      ctaRoutingActive: true,
      leadFlowTested: true,
      leadSourceActive: true,
    }));

    expect(result.currentState).toBe('LEAD_GENERATION');
    expect(result.missingRequirements).toEqual(['Traffic Source Active', 'First Lead Generated']);
    expect(result.nextState).toBe('SALES');
  });
});
