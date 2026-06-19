'use client';

import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { getNextJourneyAction } from '@/modules/journey/utils/getNextJourneyAction';
import {
  resolveJourneyCompletion,
  toJourneyNextActionInput,
} from '@/modules/journey/services/JourneyCompletionResolver';
import {
  DAY_MISSIONS,
  getActivationLevel,
  TOTAL_DAYS,
} from '../services/activation-service';

export function useActivation() {
  const mission = useMissionState();
  const state = mission.data?.data;
  const completion = resolveJourneyCompletion({
    completedChecks: state?.completedChecks,
    progressPercent: state?.progressPercent,
  });
  const journeyAction = getNextJourneyAction(toJourneyNextActionInput(completion));

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
