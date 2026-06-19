import {
  getNextRevenueMilestone,
  REVENUE_MILESTONES,
} from '@/modules/revenue-activation/services/revenue-journey-service';
import type { RevenueProgress } from '../contracts/RevenueProgress';
import { metadataFor, readJourneyProgress } from './journey-adapter-diagnostics';

export async function adaptJourneyRevenueProgress(userId: string): Promise<RevenueProgress> {
  const progress = await readJourneyProgress(userId);
  const metadata = metadataFor('revenue-journey-service+userProgress', progress);
  const achievedMilestones = REVENUE_MILESTONES
    .filter((milestone) => progress.completedChecks.includes(milestone.title))
    .map((milestone) => milestone.title);
  const nextMilestone = getNextRevenueMilestone(progress.completedChecks);

  return {
    ...metadata,
    currentMilestone: achievedMilestones.at(-1) ?? 'none',
    nextMilestone: nextMilestone?.title ?? 'none',
    completionPercent: Math.round((achievedMilestones.length / REVENUE_MILESTONES.length) * 100),
    achievedMilestones,
  };
}
