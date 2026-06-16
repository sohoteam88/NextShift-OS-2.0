'use client';

import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { getNextJourneyAction } from '@/modules/journey/utils/getNextJourneyAction';
import {
  DAY_MISSIONS,
  getActivationLevel,
  TOTAL_DAYS,
} from '../services/activation-service';

export function useActivation() {
  const mission = useMissionState();
  const state = mission.data?.data;
  const completedChecks = state?.completedChecks ?? [];
  const checkSet = new Set(completedChecks);

  const journeyAction = getNextJourneyAction({
    brandInterview: checkSet.has('brand_interview') || (state?.progressPercent ?? 0) >= 10,
    brandDNA: checkSet.has('brand_dna') || (state?.progressPercent ?? 0) >= 25,
    firstContent: checkSet.has('first_content') || (state?.progressPercent ?? 0) >= 40,
    firstLead: checkSet.has('first_lead') || (state?.progressPercent ?? 0) >= 55,
    firstCustomer: checkSet.has('first_customer') || (state?.progressPercent ?? 0) >= 70,
    followUpSystem: checkSet.has('follow_up_system') || (state?.progressPercent ?? 0) >= 85,
    firstMember: checkSet.has('first_member') || (state?.progressPercent ?? 0) >= 95,
  });

  const currentDay = journeyAction.progressStep;
  const complete = journeyAction.stageName === '全部完成';
  const mission_ = complete ? null : DAY_MISSIONS[currentDay - 1] ?? null;
  const progressPercent = Math.round((currentDay / TOTAL_DAYS) * 100);
  const score = progressPercent;
  const level = getActivationLevel(score);

  return {
    currentDay,
    dayMission: mission_,
    isComplete: complete,
    score,
    activationLevel: level,
    totalDays: TOTAL_DAYS,
    progressPercent,
    isLoading: mission.isLoading,
  };
}
