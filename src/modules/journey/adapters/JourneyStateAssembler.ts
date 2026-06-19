import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { getInterviewAuthority } from '@/modules/interview-authority/services/InterviewAuthorityService';
import type { JourneyState } from '../contracts/JourneyState';
import { adaptJourneyMilestones } from './JourneyMilestoneAdapter';
import { adaptJourneyMissions } from './JourneyMissionAdapter';
import { adaptJourneyNextAction } from './JourneyNextActionAdapter';
import { adaptJourneyProgression } from './JourneyProgressionAdapter';
import { adaptJourneyRevenueProgress } from './JourneyRevenueProgressAdapter';

export async function assembleJourneyState(userId: string): Promise<JourneyState> {
  const [interviewAuthority, businessState] = await Promise.all([
    getInterviewAuthority(userId),
    businessStateService.getBusinessState(userId),
  ]);
  const [progression, milestones, missions, nextAction, revenueProgress] = await Promise.all([
    adaptJourneyProgression(userId, {
      businessMode: interviewAuthority.businessContext.businessMode,
      businessStage: businessState.stage,
      readiness: businessState.readiness,
      bottlenecks: businessState.bottlenecks,
    }),
    adaptJourneyMilestones(userId),
    adaptJourneyMissions(userId),
    adaptJourneyNextAction(userId),
    adaptJourneyRevenueProgress(userId),
  ]);

  return {
    source: 'JourneyStateAssembler',
    scope: 'user',
    confidence: progression.confidence,
    fallback: progression.fallback,
    stage: progression.stage,
    milestones,
    missions,
    nextAction,
    revenueProgress,
  };
}
