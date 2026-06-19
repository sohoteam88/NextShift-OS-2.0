import prisma from '@/lib/prisma';
import { journeyStateService } from '@/modules/journey/services/JourneyStateService';
import type { JourneyState } from '@/modules/journey/contracts/JourneyState';
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

function buildJourneyRecommendation(journeyState: JourneyState): COORecommendation {
  const completedMilestones = journeyState.milestones.filter((item) => item.completed).length;

  return {
    source: 'JourneyStateService',
    scope: 'user',
    confidence: journeyState.confidence === 'confirmed' ? 'confirmed' : journeyState.confidence === 'fallback' ? 'fallback' : 'derived',
    fallback: journeyState.fallback,

    id: `journey-next-action-${journeyState.stage}`,
    type: 'strategic',
    title: journeyState.nextAction.title,
    summary: journeyState.nextAction.description,
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
    priority: journeyState.revenueProgress.completionPercent < 50 ? 'high' : 'medium',
    horizon: 'week',
    reasoning: [
      `Journey stage: ${journeyState.stage}.`,
      `Completed milestones: ${completedMilestones}/${journeyState.milestones.length}.`,
      `Revenue milestone: ${journeyState.revenueProgress.currentMilestone} -> ${journeyState.revenueProgress.nextMilestone}.`,
    ],
    expectedOutcome: `Advance journey via ${journeyState.nextAction.title}.`,
    supportingSignals: [
      `journey-stage:${journeyState.stage}`,
      `journey-action:${journeyState.nextAction.route}`,
      `revenue-progress:${journeyState.revenueProgress.completionPercent}`,
    ],
    relatedRoute: journeyState.nextAction.route,
  };
}

export async function assembleCOOPlan(userId: string): Promise<COOPlan> {
  const [user, journeyState] = await Promise.all([
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
  ]);

  if (!user) throw new Error('User not found');

  const plan = user.tenant?.plan ?? 'free';
  const currentStage = journeyStageToAgentStage(journeyState.stage);
  const ceoResult = await adaptCEORecommendations(user.id, user.tenantId);
  const journeyRecommendation = buildJourneyRecommendation(journeyState);
  const assignments = await adaptAssignments({
    userId: user.id,
    tenantId: user.tenantId,
    plan,
    currentStage,
    explicitGoal: journeyState.nextAction.title,
    ceoReport: ceoResult.report,
  });
  const delegations = adaptDelegations(assignments);

  return {
    source: 'COOPlanAssembler',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',

    id: `coo-plan-${user.id}`,
    subjectId: user.id,
    generatedAt: new Date().toISOString(),
    horizon: 'week',
    strategicFocus: journeyRecommendation.title,
    recommendations: [journeyRecommendation, ...ceoResult.recommendations],
    assignments,
    delegations,
  };
}
