import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { missionService } from '@/modules/mission/services/mission-service';
import { deriveLevel } from '../core/derive-level';
import { deriveUnlocks } from '../core/derive-unlocks';
import type { EvolutionSnapshot } from '../types/evolution-snapshot';

type MinimalUserRecord = {
  id: string;
  tenantId: string;
};

function nextLevelFor(level: EvolutionSnapshot['level']): EvolutionSnapshot['nextLevel'] {
  switch (level) {
    case 'explorer':
      return 'builder';
    case 'builder':
      return 'operator';
    case 'operator':
      return 'leader';
    case 'leader':
      return null;
  }
}

function normalizeMissionChecks(completedChecks: string[] | unknown): string[] {
  if (!Array.isArray(completedChecks)) return [];
  return completedChecks.filter((item): item is string => typeof item === 'string');
}

async function loadUser(userId: string): Promise<MinimalUserRecord> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true },
  });

  if (!user) {
    throw new AppError('NOT_FOUND', 404, 'User not found');
  }

  return user;
}

export interface EvolutionAdapterInput {
  userId: string;
}

export async function buildEvolutionSnapshot(input: EvolutionAdapterInput): Promise<EvolutionSnapshot> {
  const user = await loadUser(input.userId);
  const authUser: AuthUser = {
    id: user.id,
    tenantId: user.tenantId,
    email: '',
    role: 'member',
    name: '',
    preferredLanguage: 'zh',
    status: 'active',
  };

  const [progress, journeyMap] = await Promise.all([
    missionService.getState(authUser),
    missionService.getJourneyMap(authUser),
  ]);

  const completedChecks = normalizeMissionChecks(progress.completedChecks);
  const levelState = deriveLevel({
    brandInterview: completedChecks.includes('brand_interview') || progress.progressPercent >= 10,
    brandDNA: completedChecks.includes('brand_dna') || progress.progressPercent >= 25,
    socialSetup: completedChecks.includes('social_setup') || progress.progressPercent >= 35,
    contentCount: progress.progressPercent >= 40 ? 3 : progress.progressPercent >= 30 ? 1 : 0,
    leadCount: progress.progressPercent >= 55 ? 1 : 0,
    customerCount: progress.progressPercent >= 70 ? 1 : 0,
    teamMemberCount: progress.progressPercent >= 95 ? 1 : 0,
    crmActive: completedChecks.includes('crm_setup'),
    followUpActive: completedChecks.includes('follow_up_active'),
  });

  const unlockedModules = deriveUnlocks(levelState.level);

  return {
    level: levelState.level,
    progressPercentage: progress.progressPercent,
    currentStage: progress.currentStage?.id ?? 'growth_mode',
    nextLevel: nextLevelFor(levelState.level),
    unlockedModules,
    completedMissions: completedChecks.length,
    totalMissions: journeyMap.length,
  };
}
