import { getCurrentMission } from '@/modules/mission-engine/services/mission-service';
import {
  resolveJourneyCompletion,
  toMissionInput,
} from '@/modules/journey/services/JourneyCompletionResolver';
import type { JourneyMission } from '../contracts/JourneyMission';
import { metadataFor, readJourneyProgress } from './journey-adapter-diagnostics';

export async function adaptJourneyMissions(userId: string): Promise<JourneyMission[]> {
  const progress = await readJourneyProgress(userId);
  const metadata = metadataFor('mission-engine.getCurrentMission+userProgress', progress);
  const completion = resolveJourneyCompletion({
    completedChecks: progress.completedChecksValue,
    progressPercent: progress.progressPercent,
  });

  const mission = getCurrentMission(toMissionInput(completion, 'explorer'));

  return [{
    ...metadata,
    id: mission.id,
    title: mission.title,
    description: mission.description,
    status: mission.completed ? 'completed' : progress.completedChecks.length > 0 ? 'in_progress' : 'not_started',
  }];
}
