'use client';

import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { getRevenueScore, getRevenueLevel, getNextRevenueMilestone, isRevenueJourneyComplete, REVENUE_MILESTONES } from '../services/revenue-journey-service';

export function useRevenueJourney() {
  const mission = useMissionState();
  const state = mission.data?.data;
  const completedChecks = state?.completedChecks ?? [];
  const score = getRevenueScore(completedChecks);
  const level = getRevenueLevel(score);
  const nextMilestone = getNextRevenueMilestone(completedChecks);
  const complete = isRevenueJourneyComplete(completedChecks);
  const completedCount = REVENUE_MILESTONES.filter(m => completedChecks.includes(m.title)).length;

  return {
    score,
    level,
    nextMilestone,
    isComplete: complete,
    completedCount,
    totalMilestones: REVENUE_MILESTONES.length,
    progressPercent: Math.round((completedCount / REVENUE_MILESTONES.length) * 100),
    isLoading: mission.isLoading,
  };
}
