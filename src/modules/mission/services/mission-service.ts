import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import {
  JOURNEY_MAP,
  getNextStage,
  getProgressPercent,
  getStageById,
  getTotalXP,
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

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
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
          completedChecks: ['registered', 'approved'],
          totalXp: 10,
          mode: 'guided',
        },
      });
    }

    return progress;
  },

  async getState(user: AuthUser): Promise<MissionState> {
    const progress = await this.getProgress(user);
    const completedChecks = toStringArray(progress.completedChecks);
    const nextStage = getNextStage(completedChecks);
    const currentStage = nextStage ?? getStageById('growth_mode') ?? null;

    return {
      currentStage,
      nextStage,
      progressPercent: getProgressPercent(completedChecks),
      totalXP: getTotalXP(completedChecks),
      completedChecks,
      mode: progress.mode === 'advanced' ? 'advanced' : 'guided',
      isJourneyComplete: nextStage === null,
      estimatedTimeToNext: nextStage ? this.formatMinutes(nextStage.estimated_minutes) : '已完成',
      estimatedTimeToFirstLead: this.estimateTimeTo(completedChecks, 'lead_magnet_created'),
      estimatedTimeToFirstSale: this.estimateTimeTo(completedChecks, 'first_sale_completed'),
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
    const completedChecks = new Set(toStringArray(progress.completedChecks));

    if (completedChecks.has(checkKey)) {
      return { newlyCompleted: null, isNewMilestone: false, newAchievements: [] };
    }

    completedChecks.add(checkKey);

    const stage = JOURNEY_MAP.find((item) => item.completion_check === checkKey) ?? null;
    const nextCompletedChecks = [...completedChecks];
    const totalXp = getTotalXP(nextCompletedChecks);
    const milestonesSeen = new Set(toStringArray(progress.milestonesSeen));
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

    const newAchievements = await checkAndUnlockAchievements(user, nextCompletedChecks);

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
    const completedChecks = toStringArray(progress.completedChecks);

    return JOURNEY_MAP.map((stage) => ({
      ...stage,
      status: completedChecks.includes(stage.completion_check)
        ? 'completed'
        : stage.id === progress.currentStageId
          ? 'active'
          : 'locked',
    }));
  },
};
