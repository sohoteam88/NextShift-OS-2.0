'use client';

import * as React from 'react';
import { useMissionState } from '@/modules/mission/hooks/use-mission';
import { getUserLevel } from '../services/user-level-service';
import { getUnlockedModules, isModuleUnlocked, getLockedReason } from '../services/unlock-service';
import { checkNewAchievements, getAllAchievements } from '../services/achievement-service';
import { calculateProgress } from '../services/milestone-service';
import { getAICoachPersona } from '../services/ai-coach-persona';
import type { UserEvolutionState, Achievement } from '../types/evolution.types';

// In-memory record of previously shown achievements (per session)
const shownAchievements = new Set<string>();

export function useUserEvolution() {
  const mission = useMissionState();
  const state = mission.data?.data;
  const completedChecks = state?.completedChecks ?? [];
  const pct = state?.progressPercent ?? 0;

  const input = {
    brandInterview: completedChecks.includes('brand_interview') || pct >= 10,
    brandDNA: completedChecks.includes('brand_dna') || pct >= 25,
    socialSetup: completedChecks.includes('social_setup') || pct >= 35,
    contentCount: pct >= 40 ? 3 : pct >= 30 ? 1 : 0,
    leadCount: pct >= 55 ? 1 : 0,
    customerCount: pct >= 70 ? 1 : 0,
    teamMemberCount: pct >= 90 ? 1 : 0,
    crmActive: completedChecks.includes('crm_setup'),
    followUpActive: completedChecks.includes('follow_up_active'),
  };

  const levelState = getUserLevel(input);
  const unlockedModules = getUnlockedModules(levelState.level);
  const { unlocked: unlockedAchievements, locked: lockedAchievements } = getAllAchievements(levelState.completedMilestones);

  // Check for newly unlocked achievements (per session)
  const newAchievement = React.useMemo(() => {
    const newOnes = checkNewAchievements(levelState.completedMilestones).filter(a => !shownAchievements.has(a.id));
    return newOnes.length > 0 ? newOnes[0] : null;
  }, [levelState.completedMilestones.join(',')]);

  const dismissAchievement = React.useCallback(() => {
    if (newAchievement) shownAchievements.add(newAchievement.id);
  }, [newAchievement]);

  const coachPersona = getAICoachPersona(levelState.level);

  const progress = {
    current: levelState.progressPercentage,
    total: 100,
    nextMilestone: levelState.nextMilestone,
  };

  return {
    level: levelState.level,
    progress: levelState.progressPercentage,
    completedMilestones: levelState.completedMilestones,
    unlockedModules,
    isModuleUnlocked: (moduleId: string) => isModuleUnlocked(moduleId, levelState.level),
    getLockedReason: (moduleId: string) => getLockedReason(moduleId, levelState.level),
    achievements: {
      unlocked: unlockedAchievements,
      locked: lockedAchievements,
      total: unlockedAchievements.length + lockedAchievements.length,
    },
    newAchievement,
    dismissAchievement,
    coachPersona,
    isLoading: mission.isLoading,
  };
}
