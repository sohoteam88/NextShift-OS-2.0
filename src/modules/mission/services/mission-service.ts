import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import {
  JOURNEY_MAP,
  extractCheckKeys,
  getCompletionDate,
  getNextStage,
  getProgressPercent,
  getStageById,
  getTotalXP,
  type CompletedCheckEntry,
  type CompletedChecksValue,
  type JourneyStage,
  type JourneyStageId,
} from '../constants/journey-map';
import { checkAndUnlockAchievements } from './achievement-service';

export interface MissionState {
  currentStage: JourneyStage | null;
  nextStage: JourneyStage | null;
  progressPercent: number;
  totalXP: number;
  completedChecks: string[];
  mode: 'guided' | 'advanced';
  isJourneyComplete: boolean;
  estimatedTimeToNext: string;
  estimatedTimeToFirstLead: string | null;
  estimatedTimeToFirstSale: string | null;
}

function toCompletedChecks(value: unknown): CompletedChecksValue {
  if (!Array.isArray(value)) return [];
  if (value.length === 0) return [];
  if (typeof value[0] === 'string') {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return value.filter((item): item is CompletedCheckEntry => {
    if (!item || typeof item !== 'object') return false;
    const entry = item as Record<string, unknown>;
    return typeof entry.check === 'string' && typeof entry.completed_at === 'string';
  });
}

function toCompletedCheckEntries(value: unknown): CompletedCheckEntry[] {
  const checks = toCompletedChecks(value);
  if (checks.length === 0) return [];
  if (typeof checks[0] !== 'string') return checks as CompletedCheckEntry[];
  return (checks as string[]).map((check) => ({
    check,
    completed_at: new Date().toISOString(),
  }));
}

export const missionService = {
  async getProgress(user: AuthUser) {
    let progress = await prisma.userProgress.findUnique({
      where: { userId: user.id },
    });

    if (!progress) {
      progress = await prisma.userProgress.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          currentStageId: 'brand_discovery',
          completedChecks: [
            { check: 'registered', completed_at: new Date().toISOString() },
            { check: 'approved', completed_at: new Date().toISOString() },
          ],
          totalXp: 10,
          mode: 'guided',
        },
      });
    }

    return progress;
  },

  async getState(user: AuthUser): Promise<MissionState> {
    const progress = await this.getProgress(user);
    const completedChecks = toCompletedChecks(progress.completedChecks);
    const checkKeys = extractCheckKeys(completedChecks);
    const nextStage = getNextStage(completedChecks);
    const currentStage = nextStage ?? getStageById('growth_mode') ?? null;

    return {
      currentStage,
      nextStage,
      progressPercent: getProgressPercent(completedChecks),
      totalXP: getTotalXP(completedChecks),
      completedChecks: checkKeys,
      mode: progress.mode === 'advanced' ? 'advanced' : 'guided',
      isJourneyComplete: nextStage === null,
      estimatedTimeToNext: nextStage ? this.formatMinutes(nextStage.estimated_minutes) : '已完成',
      estimatedTimeToFirstLead: this.estimateTimeTo(checkKeys, 'lead_magnet_created'),
      estimatedTimeToFirstSale: this.estimateTimeTo(checkKeys, 'first_sale_completed'),
    };
  },

  async completeCheck(
    user: AuthUser,
    checkKey: string,
  ): Promise<{
    newlyCompleted: JourneyStage | null;
    isNewMilestone: boolean;
    newAchievements: string[];
  }> {
    const progress = await this.getProgress(user);
    const completedEntries = toCompletedCheckEntries(progress.completedChecks);
    const completedChecks = new Set(extractCheckKeys(completedEntries));

    if (completedChecks.has(checkKey)) {
      return { newlyCompleted: null, isNewMilestone: false, newAchievements: [] };
    }

    completedChecks.add(checkKey);
    completedEntries.push({ check: checkKey, completed_at: new Date().toISOString() });

    const stage = JOURNEY_MAP.find((item) => item.completion_check === checkKey) ?? null;
    if (checkKey === 'first_sale_completed') {
      completedChecks.add('growth_mode_active');
      if (!completedEntries.some((entry) => entry.check === 'growth_mode_active')) {
        completedEntries.push({ check: 'growth_mode_active', completed_at: new Date().toISOString() });
      }
    }

    const nextCompletedChecks = completedEntries;
    const totalXp = getTotalXP(nextCompletedChecks);
    const milestonesSeen = new Set(
      Array.isArray(progress.milestonesSeen)
        ? progress.milestonesSeen.filter((item): item is string => typeof item === 'string')
        : [],
    );
    let isNewMilestone = false;

    if (stage?.is_milestone && !milestonesSeen.has(stage.id)) {
      isNewMilestone = true;
      milestonesSeen.add(stage.id);
    }

    const nextStage = getNextStage(nextCompletedChecks);

    await prisma.userProgress.update({
      where: { userId: user.id },
      data: {
        completedChecks: nextCompletedChecks,
        totalXp,
        currentStageId: nextStage?.id ?? 'growth_mode',
        stageStartedAt: new Date(),
        lastActivityAt: new Date(),
        milestonesSeen: [...milestonesSeen],
      },
    });

    const newAchievements = await checkAndUnlockAchievements(user, extractCheckKeys(nextCompletedChecks));

    return { newlyCompleted: stage, isNewMilestone, newAchievements };
  },

  async setMode(user: AuthUser, mode: 'guided' | 'advanced') {
    await this.getProgress(user);
    return prisma.userProgress.update({
      where: { userId: user.id },
      data: { mode, lastActivityAt: new Date() },
    });
  },

  async skipStage(user: AuthUser, stageId: JourneyStageId) {
    const stage = getStageById(stageId);
    if (!stage) {
      throw new Error('Invalid stage');
    }

    return this.completeCheck(user, stage.completion_check);
  },

  estimateTimeTo(completedChecks: string[], targetCheck: string): string | null {
    if (completedChecks.includes(targetCheck)) return '已完成';

    const targetStage = JOURNEY_MAP.find((stage) => stage.completion_check === targetCheck);
    if (!targetStage) return null;

    let totalMinutes = 0;
    for (const stage of JOURNEY_MAP) {
      if (completedChecks.includes(stage.completion_check)) continue;
      totalMinutes += stage.estimated_minutes;
      if (stage.id === targetStage.id) break;
    }

    const days = Math.max(1, Math.ceil(totalMinutes / 20));
    return `约 ${days} 天`;
  },

  formatMinutes(minutes: number): string {
    if (minutes === 0) return '即将自动完成';
    if (minutes < 60) return `约 ${minutes} 分钟`;
    return `约 ${Math.round(minutes / 60)} 小时`;
  },

  async getJourneyMap(user: AuthUser) {
    const progress = await this.getProgress(user);
    const completedChecks = toCompletedChecks(progress.completedChecks);
    const checkKeys = extractCheckKeys(completedChecks);

    return JOURNEY_MAP.map((stage) => ({
      ...stage,
      completed_at: getCompletionDate(completedChecks, stage.completion_check) ?? undefined,
      status: checkKeys.includes(stage.completion_check)
        ? 'completed'
        : stage.id === progress.currentStageId
          ? 'active'
          : 'locked',
    }));
  },
};
