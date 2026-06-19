import { getCompletionDate, JOURNEY_MAP } from '@/modules/mission/constants/journey-map';
import type { JourneyMilestone } from '../contracts/JourneyMilestone';
import { metadataFor, readJourneyProgress } from './journey-adapter-diagnostics';

export async function adaptJourneyMilestones(userId: string): Promise<JourneyMilestone[]> {
  const progress = await readJourneyProgress(userId);
  const baseMetadata = metadataFor('JOURNEY_MAP+userProgress', progress);

  return JOURNEY_MAP
    .filter((stage) => stage.is_milestone)
    .map<JourneyMilestone>((stage) => {
      const completed = progress.completedChecks.includes(stage.completion_check);
      const completedAt = completed ? getCompletionDate(progress.completedChecksValue, stage.completion_check) : null;
      const missingCompletionDate = completed && !completedAt;

      return {
        ...baseMetadata,
        confidence: missingCompletionDate ? 'fallback' : baseMetadata.confidence,
        fallback: missingCompletionDate ? 'completion_date_missing' : baseMetadata.fallback,
        id: stage.id,
        title: stage.name_zh,
        completed,
        ...(completedAt ? { completedAt } : {}),
      };
    });
}
