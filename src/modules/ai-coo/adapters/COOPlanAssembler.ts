import prisma from '@/lib/prisma';
import { journeyStateService } from '@/modules/journey/services/JourneyStateService';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import { getInterviewAuthorityProjection } from '@/modules/interview-authority/services/interview-authority-service';
import { businessContextMemoryService } from '@/modules/business-context-memory/services/business-context-memory-service';
import { aiCOODecisionEngine } from '@/modules/ai-coo/services/ai-coo-decision-engine';
import type { JourneyState } from '@/modules/journey/contracts/JourneyState';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';
import type { InterviewAuthorityProjection } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { BusinessContextProjection } from '@/modules/business-context-memory/contracts/BusinessContextMemory';
import type { AICOORequestContext } from '../contracts/AICOORequestContext';
import type { COOPlan } from '../contracts/COOPlan';
import type { COORecommendation } from '../contracts/COORecommendation';
import { adaptAssignments } from './AssignmentAdapter';
import { adaptCEORecommendations } from './CEORecommendationAdapter';
import { adaptDelegations } from './DelegationAdapter';

function journeyStageToAgentStage(stage: JourneyState['stage']): string {
  switch (stage) {
    case 'brand_foundation':
      return 'brand_discovery';
    case 'audience_validation':
      return 'social_setup';
    case 'offer_creation':
      return 'lead_magnet';
    case 'content_activation':
      return 'first_content';
    case 'lead_generation':
      return 'traffic_campaign';
    case 'customer_acquisition':
      return 'crm_setup';
    case 'team_growth':
    case 'scale':
      return 'growth_mode';
  }
}

function buildMissionRecommendation(
  missionAuthority: MissionAuthoritySnapshot,
  journeyState: JourneyState,
  interviewAuthority: InterviewAuthorityProjection,
): COORecommendation {
  const mission = missionAuthority.currentMission;
  const completedMilestones = journeyState.milestones.filter((item) => item.completed).length;

  return {
    source: 'MissionEngineAuthorityService',
    scope: 'user',
    confidence: missionAuthority.confidence === 'confirmed'
      ? 'confirmed'
      : missionAuthority.confidence === 'fallback'
        ? 'fallback'
        : 'derived',
    fallback: missionAuthority.fallback,
    recommendationSource: 'journey_state',

    id: `mission-current-${mission.id}`,
    type: 'strategic',
    title: mission.title,
    summary: mission.description,
    domain: journeyState.stage === 'lead_generation'
      ? 'traffic'
      : journeyState.stage === 'offer_creation'
        ? 'funnel'
        : journeyState.stage === 'customer_acquisition'
          ? 'crm'
          : journeyState.stage === 'content_activation'
            ? 'content'
            : journeyState.stage === 'team_growth' || journeyState.stage === 'scale'
              ? 'team'
              : 'brand',
    priority: mission.priority >= 80 ? 'high' : 'medium',
    horizon: 'week',
    reasoning: [
      `Mission Engine current mission: ${mission.id}.`,
      `Interview business mode: ${interviewAuthority.businessMode}.`,
      `Interview authority score: ${interviewAuthority.authorityScore}.`,
      `Journey stage: ${journeyState.stage}.`,
      `Completed milestones: ${completedMilestones}/${journeyState.milestones.length}.`,
      `Mission progress: ${missionAuthority.progress.completedMissions}/${missionAuthority.progress.totalMissions}.`,
    ],
    expectedOutcome: mission.expectedOutcome,
    supportingSignals: [
      `mission:${mission.id}`,
      `mission-status:${mission.status}`,
      `interview-business-mode:${interviewAuthority.businessMode}`,
      `interview-readiness:${interviewAuthority.readinessScore}`,
      `journey-stage:${journeyState.stage}`,
      `mission-progress:${missionAuthority.progress.completionPercentage}`,
    ],
    relatedRoute: mission.route,
  };
}

function prioritizeWithBusinessMemory(
  recommendations: COORecommendation[],
  businessContext: BusinessContextProjection,
): COORecommendation[] {
  const recentlyIssued = new Set(businessContext.recommendationMemory.recentlyIssuedIds);
  const ignored = new Set(businessContext.recommendationMemory.ignoredIds);
  const fresh = recommendations.filter((recommendation) => !recentlyIssued.has(recommendation.id) && !ignored.has(recommendation.id));

  if (fresh.length === 0) return recommendations;

  const repeated = recommendations.filter((recommendation) => recentlyIssued.has(recommendation.id) || ignored.has(recommendation.id));
  return [...fresh, ...repeated];
}

export async function assembleCOOPlan(userId: string, context: AICOORequestContext = {}): Promise<COOPlan> {
  const [user, journeyState, missionAuthority, interviewAuthority] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        tenantId: true,
        tenant: {
          select: {
            plan: true,
          },
        },
      },
    }),
    journeyStateService.getJourneyState(userId),
    context.missionAuthority ?? missionEngineAuthorityService.getCurrentMission(userId),
    getInterviewAuthorityProjection(userId),
  ]);

  if (!user) throw new Error('User not found');

  const plan = user.tenant?.plan ?? 'free';
  const currentStage = journeyStageToAgentStage(journeyState.stage);
  const [businessContext, decision, ceoResult] = await Promise.all([
    businessContextMemoryService.getBusinessContext(user.id, user.tenantId),
    aiCOODecisionEngine.getDecision(user.id, user.tenantId, {
      businessState: context.businessState,
      missionAuthority,
    }),
    adaptCEORecommendations(user.id, user.tenantId),
  ]);
  const missionRecommendation = buildMissionRecommendation(missionAuthority, journeyState, interviewAuthority);
  const assignments = await adaptAssignments({
    userId: user.id,
    tenantId: user.tenantId,
    plan,
    currentStage,
    explicitGoal: missionAuthority.currentMission.title,
    ceoReport: ceoResult.report,
    businessRecommendations: ceoResult.source === 'business_state' ? ceoResult.recommendations : undefined,
  });
  const delegations = adaptDelegations(assignments);
  const recommendations = prioritizeWithBusinessMemory(
    [missionRecommendation, ...ceoResult.recommendations],
    businessContext,
  );
  const primaryRecommendation = recommendations[0];

  if (primaryRecommendation) {
    try {
      await businessContextMemoryService.recordRecommendationIssued({
        userId: user.id,
        tenantId: user.tenantId,
        recommendation: primaryRecommendation,
      });
    } catch (error) {
      console.warn('business_context_memory.recommendation_record_failed', {
        userId: user.id,
        recommendationId: primaryRecommendation.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return {
    source: 'COOPlanAssembler',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',

    id: `coo-plan-${user.id}`,
    subjectId: user.id,
    generatedAt: new Date().toISOString(),
    horizon: 'week',
    strategicFocus: decision.currentFocus || businessContext.recommendedFocus || missionRecommendation.title,
    decision,
    recommendations,
    assignments,
    delegations,
  };
}
