'use client';

import { useUserEvolution } from '@/modules/user-evolution/hooks/useUserEvolution';
import { getOnboardingProgress } from '../services/onboarding-service';
import type { TeamStats, OrganizationMetrics } from '../types/team.types';

export function useTeamEngine() {
  const evolution = useUserEvolution();
  const isLocked = evolution.level !== 'leader';
  const progress = getOnboardingProgress(evolution.completedMilestones);

  const stats: TeamStats = { prospects: 20, customers: 10, members: 8, activeMembers: 6, leaders: 2, retention: 82, growth: 12 };
  const org: OrganizationMetrics = { totalMembers: 28, activeMembers: 22, leaders: 4, retentionRate: 82, growthRate: 12, duplicationRate: 25 };

  return {
    isLocked,
    lockReason: 'Unlocks at Leader Level. Complete Sales Engine first.',
    showViewOnly: evolution.level === 'operator',
    showFull: evolution.level === 'leader',
    stats,
    org,
    onboarding: progress,
    onboardingSteps: getOnboardingProgress([]),
  };
}
