import { journeyEngineService } from '@/modules/journey-engine/journey-engine-service';
import type { AdaptiveJourneyProjection } from '@/modules/journey-engine/journey-projection';
import type {
  MissionAuthorityDefinition,
  MissionAuthoritySnapshot,
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

export function resolveMissionAuthorityFromJourney(journey: AdaptiveJourneyProjection): MissionAuthoritySnapshot {
  const currentMission = toMissionDefinition(journey.currentMission);
  const nextMission = journey.nextMission ? toMissionDefinition(journey.nextMission) : null;
  return {
    source: 'MissionEngineAuthorityService',
    scope: 'user',
    confidence: journey.confidence,
    fallback: journey.fallback,
    currentJourney: journey.currentJourney,
    currentMission,
    nextMission,
    progress: {
      completionPercentage: journey.completionPercentage,
      completedMissions: journey.missions.filter((mission) => mission.status === 'completed').length,
      totalMissions: journey.missions.length,
      nextMilestone: journey.nextMilestone,
      progressPath: journey.progressPath,
    },
    estimatedCompletion: {
      minutes: currentMission.estimatedMinutes,
      label: formatMinutes(currentMission.estimatedMinutes),
    },
  };
}

export const missionEngineAuthorityService = {
  async getCurrentMission(userId: string): Promise<MissionAuthoritySnapshot> {
    const journey = await journeyEngineService.getJourneyProjection(userId);
    return resolveMissionAuthorityFromJourney(journey);
  },
};
