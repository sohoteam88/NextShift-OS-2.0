import prisma from '@/lib/prisma';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { journeyStateService } from '@/modules/journey/services/JourneyStateService';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import { getInterviewAuthorityProjection } from '@/modules/interview-authority/services/interview-authority-service';
import { businessContextMemoryService } from '@/modules/business-context-memory/services/business-context-memory-service';
import { growthLoopStateService } from '@/modules/growth-loop/services/GrowthLoopStateService';
import { buildGrowthProjection } from '@/modules/growth-loop/services/growth-projection';
import { optimizationEngine } from '@/modules/optimization/services/optimization-engine';
import { activationEngine } from '@/modules/activation/services/activation-engine';
import { retentionEngine } from '@/modules/retention/services/retention-engine';
import { valueRealizationEngine } from '@/modules/value/services/value-realization-engine';
import { userSuccessEngine } from '@/modules/user-success/services/user-success-engine';
import { expansionEngine } from '@/modules/expansion/services/expansion-engine';
import { referralEngine } from '@/modules/referral/services/referral-engine';
import { buildCustomerHealthProjection } from '@/modules/customer-health/services/customer-health-projection';
import type { AICOODecision } from '../contracts/AICOODecision';
import { buildDecisionProjection } from './decision-projection';
import { detectOpportunities } from './opportunity-detector';
import { prioritizeFocus } from './focus-prioritizer';
import { detectRisks } from './risk-detector';
import { recordAICOODecision } from './decision-memory-adapter';
import type { AICOORequestContext } from '../contracts/AICOORequestContext';

export async function getAICOODecision(
  userId: string,
  tenantId?: string,
  context: AICOORequestContext = {},
): Promise<AICOODecision> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true },
  });

  if (!user) throw new Error('User not found');

  const resolvedTenantId = tenantId ?? user.tenantId;
  const [interviewAuthority, businessState, journeyState, missionAuthority, businessContext, growthLoopState, optimizationProjection, activationProjection, retentionProjection, valueProjection, userSuccessProjection, expansionProjection, referralProjection] = await Promise.all([
    getInterviewAuthorityProjection(user.id),
    context.businessState ?? businessStateService.getBusinessState(user.id),
    journeyStateService.getJourneyState(user.id),
    context.missionAuthority ?? missionEngineAuthorityService.getCurrentMission(user.id),
    businessContextMemoryService.getBusinessContext(user.id, resolvedTenantId),
    growthLoopStateService.getGrowthLoopState(user.id),
    optimizationEngine.getProjection(user.id, resolvedTenantId),
    activationEngine.getProjection(user.id, resolvedTenantId),
    retentionEngine.getProjection(user.id, resolvedTenantId),
    valueRealizationEngine.getProjection(user.id, resolvedTenantId),
    userSuccessEngine.getProjection(user.id, resolvedTenantId),
    expansionEngine.getProjection(user.id, resolvedTenantId),
    referralEngine.getProjection(user.id, resolvedTenantId),
  ]);
  const growthProjection = buildGrowthProjection(growthLoopState);
  const customerHealthProjection = buildCustomerHealthProjection({
    generatedAt: new Date().toISOString(),
    activationProjection,
    userSuccessProjection,
    retentionProjection,
    expansionProjection,
    referralProjection,
    locale: activationProjection.localization.locale,
    personalization: {
      businessModel: expansionProjection.personalization.businessModel,
      stage: expansionProjection.expansionState.currentExpansionStage,
    },
  });

  const detectorInput = {
    interviewAuthority,
    businessState,
    journeyState,
    missionAuthority,
    businessContext,
    growthLoopState,
    growthProjection,
    optimizationProjection,
    activationProjection,
    retentionProjection,
    valueProjection,
    userSuccessProjection,
    expansionProjection,
    referralProjection,
    customerHealthProjection,
  };
  const risks = detectRisks(detectorInput);
  const opportunities = detectOpportunities(detectorInput);
  const focus = prioritizeFocus({
    risks,
    opportunities,
    journeyState,
    missionAuthority,
  });
  const decision = buildDecisionProjection({
    userId: user.id,
    focusArea: focus.focusArea,
    basis: focus.basis,
    basisType: focus.basisType,
    risks,
    opportunities,
    journeyState,
    missionAuthority,
  });

  try {
    await recordAICOODecision({
      userId: user.id,
      tenantId: resolvedTenantId,
      decision,
    });
  } catch (error) {
    console.warn('ai_coo_decision.record_failed', {
      userId: user.id,
      decisionId: decision.decisionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return decision;
}

export const aiCOODecisionEngine = {
  getDecision: getAICOODecision,
};
