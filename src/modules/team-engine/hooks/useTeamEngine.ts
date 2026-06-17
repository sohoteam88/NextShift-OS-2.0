'use client';

import { useEvolutionProjection } from '@/modules/evolution/hooks/use-evolution-projection';
import { getOnboardingProgress } from '../services/onboarding-service';
import type { EvolutionSnapshot } from '@/modules/evolution/types/evolution-snapshot';
import type { TeamStats, OrganizationMetrics } from '../types/team.types';

const DEFAULT_SNAPSHOT: EvolutionSnapshot = {
  level: 'explorer',
  progressPercentage: 0,
  currentStage: 'brand_foundation',
  nextLevel: 'builder',
  unlockedModules: ['dashboard', 'journey', 'brand-builder'],
  completedMissions: 0,
  totalMissions: 0,
};

function completedMilestonesForLevel(level: EvolutionSnapshot['level']): string[] {
  switch (level) {
    case 'builder':
      return ['brand_foundation', 'content_creation', 'lead_generation'];
    case 'operator':
      return ['brand_foundation', 'content_creation', 'lead_generation', 'customer_acquisition'];
    case 'leader':
      return ['brand_foundation', 'content_creation', 'lead_generation', 'customer_acquisition', 'system_building'];
    case 'explorer':
    default:
      return [];
  }
}

export function useTeamEngine() {
  const { snapshot } = useEvolutionProjection();
  const resolvedSnapshot = snapshot ?? DEFAULT_SNAPSHOT;
  const isLocked = resolvedSnapshot.level !== 'leader';
  const progress = getOnboardingProgress(completedMilestonesForLevel(resolvedSnapshot.level));

  const stats: TeamStats = { prospects: 20, customers: 10, members: 8, activeMembers: 6, leaders: 2, retention: 82, growth: 12 };
  const org: OrganizationMetrics = { totalMembers: 28, activeMembers: 22, leaders: 4, retentionRate: 82, growthRate: 12, duplicationRate: 25 };

  return {
    isLocked,
    lockReason: 'Unlocks at Leader Level. Complete Sales Engine first.',
    showViewOnly: resolvedSnapshot.level === 'operator',
    showFull: resolvedSnapshot.level === 'leader',
    stats,
    org,
    onboarding: progress,
    onboardingSteps: getOnboardingProgress([]),
  };
}
