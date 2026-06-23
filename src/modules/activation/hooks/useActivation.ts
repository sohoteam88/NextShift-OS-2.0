'use client';

import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { extractCheckKeys } from '@/modules/mission/utils/completed-checks';
import {
  getActivationDay,
  getActivationLevel,
  getCurrentDayMission,
  isActivationComplete,
  TOTAL_DAYS,
} from '../services/activation-service';

export function useActivation() {
  const mission = useMissionState();
  const state = mission.data?.data;
  const completedEvents = extractCheckKeys(state?.completedChecks ?? []);
  const currentDay = getActivationDay(completedEvents);
  const complete = isActivationComplete(completedEvents);
  const mission_ = getCurrentDayMission(completedEvents);
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
