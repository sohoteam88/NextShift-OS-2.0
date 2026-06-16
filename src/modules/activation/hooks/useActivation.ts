'use client';

import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { getActivationDay, getCurrentDayMission, isActivationComplete, getActivationScore, getActivationLevel, TOTAL_DAYS } from '../services/activation-service';

export function useActivation() {
  const mission = useMissionState();
  const state = mission.data?.data;
  const completedChecks = state?.completedChecks ?? [];
  const currentDay = getActivationDay(completedChecks);
  const mission_ = getCurrentDayMission(completedChecks);
  const complete = isActivationComplete(completedChecks);
  const score = getActivationScore(completedChecks);
  const level = getActivationLevel(score);

  return {
    currentDay,
    dayMission: mission_,
    isComplete: complete,
    score,
    activationLevel: level,
    totalDays: TOTAL_DAYS,
    progressPercent: Math.round((currentDay - 1) / TOTAL_DAYS * 100),
    isLoading: mission.isLoading,
  };
}
