import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import type { JourneyMission } from '../contracts/JourneyMission';

export async function adaptJourneyMissions(userId: string): Promise<JourneyMission[]> {
  const authority = await missionEngineAuthorityService.getCurrentMission(userId);
  const mission = authority.currentMission;

  return [{
    source: authority.source,
    scope: authority.scope,
    confidence: authority.confidence,
    fallback: authority.fallback,
    id: mission.id,
    title: mission.title,
    description: mission.description,
    status: mission.status === 'completed'
      ? 'completed'
      : mission.status === 'active'
        ? 'in_progress'
        : 'not_started',
  }];
}
