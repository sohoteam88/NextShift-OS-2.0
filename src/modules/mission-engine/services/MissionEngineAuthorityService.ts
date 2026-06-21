import { journeyEngineService } from '@/modules/journey-engine/journey-engine-service';
import type { AdaptiveJourneyProjection } from '@/modules/journey-engine/journey-projection';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import type { BusinessStateResult } from '@/modules/business-state/contracts/BusinessStateResult';
import type {
  DashboardPriority,
  MissionBottleneck,
  MissionBusinessStage,
  MissionAuthorityDefinition,
  MissionAuthoritySnapshot,
  MissionLifecycleStatus,
  MissionPriorityAction,
  MissionType,
} from '../contracts/MissionAuthority';

function formatMinutes(minutes: number) {
  if (minutes <= 0) return '即将完成';
  return `${minutes} 分钟`;
}

function toMissionDefinition(mission: AdaptiveJourneyProjection['missions'][number]): MissionAuthorityDefinition {
  return {
    id: mission.id,
    title: mission.title,
    description: mission.description,
    expectedOutcome: mission.expectedOutcome,
    estimatedMinutes: mission.estimatedMinutes,
    status: mission.status === 'active' ? 'active' : mission.status,
    priority: mission.priority,
    unlockConditions: mission.unlockConditions,
    completionConditions: mission.completionConditions,
    nextMissionId: mission.nextMissionId,
    route: mission.route,
  };
}

const AI_INTERVIEW_MISSION: MissionAuthorityDefinition = {
  id: 'MISSION_AI_INTERVIEW',
  title: 'Start AI Interview',
  description: 'Business profile unavailable. Complete the AI Interview so the AI COO can determine your next mission.',
  expectedOutcome: 'Business profile available for mission analysis.',
  estimatedMinutes: 8,
  status: 'active',
  priority: 100,
  unlockConditions: [],
  completionConditions: ['brand_discovery_completed'],
  route: '/brand-builder/step/interview',
};

function completedLabels(journey: AdaptiveJourneyProjection) {
  return journey.progressPath
    .filter((item) => item.status === 'completed')
    .map((item) => item.label);
}

function hasCompleted(journey: AdaptiveJourneyProjection, check: string) {
  return journey.missions.some((mission) => (
    mission.completionConditions.includes(check) && mission.status === 'completed'
  ));
}

function businessStageFor(mission: MissionAuthorityDefinition): MissionBusinessStage {
  if (mission.completionConditions.includes('brand_discovery_completed')) return 'BRAND_FOUNDATION';
  if (
    mission.completionConditions.includes('brand_dna_confirmed')
    || mission.completionConditions.includes('positioning_completed')
  ) return 'BRAND_POSITIONING';
  if (mission.completionConditions.includes('first_content_generated')) return 'CONTENT_SYSTEM';
  if (mission.completionConditions.includes('lead_magnet_created')) return 'LEAD_MAGNET';
  if (mission.completionConditions.includes('funnel_published')) return 'FUNNEL';
  if (mission.completionConditions.includes('traffic_campaign_launched')) return 'LEAD_GENERATION';
  if (
    mission.completionConditions.includes('first_sale_completed')
    || mission.completionConditions.includes('whatsapp_followup_configured')
    || mission.completionConditions.includes('crm_setup_completed')
  ) return 'SALES';
  if (mission.route.includes('/team')) return 'TEAM_BUILDING';
  return 'BRAND_FOUNDATION';
}

function bottleneckFor(mission: MissionAuthorityDefinition): MissionBottleneck {
  if (mission.completionConditions.includes('brand_discovery_completed')) return 'NO_BRAND';
  if (
    mission.completionConditions.includes('brand_dna_confirmed')
    || mission.completionConditions.includes('positioning_completed')
  ) return 'NO_POSITIONING';
  if (mission.completionConditions.includes('first_content_generated')) return 'NO_CONTENT';
  if (mission.completionConditions.includes('lead_magnet_created')) return 'NO_LEAD_MAGNET';
  if (mission.completionConditions.includes('funnel_published')) return 'NO_FUNNEL';
  if (mission.completionConditions.includes('traffic_campaign_launched')) return 'NO_TRAFFIC';
  if (mission.completionConditions.includes('whatsapp_followup_configured')) return 'NO_LEADS';
  if (mission.completionConditions.includes('crm_setup_completed')) return 'NO_APPOINTMENTS';
  if (mission.completionConditions.includes('first_sale_completed')) return 'NO_CUSTOMERS';
  if (mission.route.includes('/team')) return 'NO_TEAM';
  return 'NO_BRAND';
}

function bottleneckForBusinessState(stateResult: BusinessStateResult): MissionBottleneck {
  const missing = new Set(stateResult.missingRequirements);

  switch (stateResult.currentState) {
    case 'BRAND_FOUNDATION':
      return 'NO_BRAND';
    case 'BRAND_POSITIONING':
      return 'NO_POSITIONING';
    case 'CONTENT_SYSTEM':
      return 'NO_CONTENT';
    case 'LEAD_MAGNET':
      return 'NO_LEAD_MAGNET';
    case 'FUNNEL':
      return 'NO_FUNNEL';
    case 'LEAD_GENERATION':
      if (missing.has('Traffic Source Active')) return 'NO_TRAFFIC';
      return missing.has('First Lead Generated') ? 'NO_LEADS' : 'NO_TRAFFIC';
    case 'SALES':
      if (missing.has('Lead Exists')) return 'NO_LEADS';
      if (missing.has('First Customer Acquired')) return 'NO_CUSTOMERS';
      return 'NO_APPOINTMENTS';
    case 'TEAM_BUILDING':
      return 'NO_TEAM';
  }
}

function missionTypeFor(mission: MissionAuthorityDefinition): MissionType {
  if (mission.route.includes('/content')) return 'CONTENT';
  if (mission.route.includes('/lead-magnet')) return 'LEAD_MAGNET';
  if (mission.route.includes('/funnel')) return 'FUNNEL';
  if (mission.route.includes('/traffic')) return 'TRAFFIC';
  if (mission.route.includes('/customer') || mission.route.includes('/crm')) return 'CUSTOMERS';
  if (mission.route.includes('/team')) return 'TEAM';
  if (
    mission.completionConditions.includes('brand_dna_confirmed')
    || mission.completionConditions.includes('positioning_completed')
  ) return 'POSITIONING';
  return 'BRAND';
}

function priorityFor(mission: MissionAuthorityDefinition): DashboardPriority {
  if (mission.priority >= 90) return 'Critical';
  if (mission.priority >= 50) return 'High';
  return 'Normal';
}

function lifecycleFor(status: MissionAuthorityDefinition['status']): MissionLifecycleStatus {
  if (status === 'completed') return 'COMPLETED';
  if (status === 'active') return 'ACTIVE';
  if (status === 'blocked') return 'FAILED';
  return 'PENDING';
}

function reasoningFor(input: {
  mission: MissionAuthorityDefinition;
  bottleneck: MissionBottleneck;
  completed: string[];
  businessState?: BusinessStateResult;
}) {
  const completedText = input.completed.length > 0
    ? `Completed: ${input.completed.join(', ')}.`
    : 'Completed: no prior business foundation has been confirmed yet.';
  const stateReason = input.businessState
    ? `Business State resolved ${input.businessState.currentState}. Missing: ${input.businessState.missingRequirements.join(', ') || 'none'}. ${input.businessState.explainability.reason}`
    : 'Business State resolved from Journey mission requirements.';

  return [
    completedText,
    `Current gap: ${input.bottleneck}.`,
    stateReason,
    `Because this is the first missing requirement preventing progress, the highest leverage action is "${input.mission.title}".`,
    'Why not something else: the AI COO fixes the bottleneck before optimizing, scaling, or automating.',
  ].join(' ');
}

function buildPriorityAction(mission: MissionAuthorityDefinition): MissionPriorityAction {
  return {
    missionType: missionTypeFor(mission),
    title: mission.title,
    route: mission.route,
    priority: priorityFor(mission),
  };
}

export function resolveMissionAuthorityFromJourney(
  journey: AdaptiveJourneyProjection,
  businessState?: BusinessStateResult,
): MissionAuthoritySnapshot {
  const interviewCompleted = hasCompleted(journey, 'brand_discovery_completed');
  const requiresInterview = businessState?.currentState === 'BRAND_FOUNDATION'
    && businessState.missingRequirements.includes('AI Interview Completed');
  const currentMission = interviewCompleted && !requiresInterview
    ? toMissionDefinition(journey.currentMission)
    : AI_INTERVIEW_MISSION;
  const nextMission = interviewCompleted && !requiresInterview && journey.nextMission ? toMissionDefinition(journey.nextMission) : null;
  const businessStage = businessState?.currentState ?? businessStageFor(currentMission);
  const bottleneck = businessState ? bottleneckForBusinessState(businessState) : bottleneckFor(currentMission);
  const completed = businessState
    ? businessState.completedStates
    : interviewCompleted
      ? completedLabels(journey)
      : [];
  const reasoning = reasoningFor({ mission: currentMission, bottleneck, completed, businessState });
  const priorityAction = buildPriorityAction(currentMission);
  const estimatedCompletion = {
    minutes: currentMission.estimatedMinutes,
    label: formatMinutes(currentMission.estimatedMinutes),
  };

  return {
    source: 'MissionEngineAuthorityService',
    scope: 'user',
    confidence: journey.confidence,
    fallback: journey.fallback,
    currentJourney: journey.currentJourney,
    businessStage,
    bottleneck,
    currentMission,
    nextMission,
    priorityAction,
    explainability: {
      completed,
      currentGap: bottleneck,
      reasoning,
      expectedOutcome: currentMission.expectedOutcome,
    },
    dashboardCommandCenter: {
      currentStage: businessStage,
      missionTitle: currentMission.title,
      missionDescription: currentMission.description,
      reasoning,
      expectedOutcome: currentMission.expectedOutcome,
      estimatedTime: estimatedCompletion.label,
      route: currentMission.route,
      priority: priorityAction.priority,
    },
    lifecycle: lifecycleFor(currentMission.status),
    progress: {
      completionPercentage: journey.completionPercentage,
      completedMissions: journey.missions.filter((mission) => mission.status === 'completed').length,
      totalMissions: journey.missions.length,
      nextMilestone: journey.nextMilestone,
      progressPath: journey.progressPath,
    },
    estimatedCompletion,
  };
}

export const missionEngineAuthorityService = {
  async getCurrentMission(userId: string): Promise<MissionAuthoritySnapshot> {
    const businessState = await businessStateService.getBusinessState(userId);
    const journey = await journeyEngineService.getJourneyProjection(userId);
    return resolveMissionAuthorityFromJourney(journey, businessState.stateResult);
  },
};
