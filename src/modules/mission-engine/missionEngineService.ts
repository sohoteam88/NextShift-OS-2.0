// ============================================================
// Mission Engine Service
// Core business logic for the V3 Mission Engine.
// Works with Prisma models: UserProgress, Mission, Achievement.
// Uses missionStages.ts for stage definitions.
// ============================================================

import prisma from '@/lib/prisma';
import {
  ALL_STAGES,
  getNextStage,
  getProgressPercent,
  getTotalXP,
  getStageById,
  getTotalStages,
  estimateMinutesRemaining,
  type MissionStage,
  type MissionStageId,
  type MissionMode as StageMode,
} from './missionStages';
import {
  checkAndUnlockAchievements,
  getUserAchievements,
  getAllAchievementDefs,
} from '@/modules/mission/services/achievement-service';
import type { AuthUser } from '@/modules/auth/services/auth-service';

// ============================================================
// Types
// ============================================================

export type UserMode = 'beginner' | 'advanced';

export interface CurrentMission {
  stage: MissionStage | null;
  progressPercent: number;
  totalXP: number;
  completedCheckKeys: string[];
  mode: UserMode;
  isJourneyComplete: boolean;
  estimatedMinutesToComplete: number;
}

export interface MissionProgress {
  currentStageId: string | null;
  nextStageId: string | null;
  progressPercent: number;
  totalXP: number;
  completedChecks: string[];
  totalStages: number;
  completedStages: number;
  mode: UserMode;
  isJourneyComplete: boolean;
}

export interface CompleteMissionResult {
  completedStage: MissionStage | null;
  nextStage: MissionStage | null;
  progressPercent: number;
  totalXP: number;
  newAchievements: string[];
  isJourneyComplete: boolean;
}

export interface AchievementResult {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  xpAwarded: number;
  unlockedAt: string;
}

// ============================================================
// Helpers
// ============================================================

type CompletedCheckEntry = { check: string; completed_at: string };

function normalizeCompletedChecks(value: unknown): CompletedCheckEntry[] {
  if (!Array.isArray(value)) return [];
  if (value.length === 0) return [];
  if (typeof value[0] === 'string') {
    return (value as string[]).map((check) => ({
      check,
      completed_at: new Date().toISOString(),
    }));
  }
  return value.filter((item): item is CompletedCheckEntry => {
    if (!item || typeof item !== 'object') return false;
    const entry = item as Record<string, unknown>;
    return typeof entry.check === 'string' && typeof entry.completed_at === 'string';
  });
}

function extractCheckKeys(entries: CompletedCheckEntry[]): string[] {
  return entries.map((e) => e.check);
}

function createMinimalAuthUser(userId: string, tenantId: string): AuthUser {
  return {
    id: userId,
    tenantId,
    email: '',
    role: 'member',
    name: '',
    preferredLanguage: 'zh',
    status: 'active',
  };
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return '即将自动完成';
  if (minutes < 60) return `约 ${minutes} 分钟`;
  return `约 ${Math.round(minutes / 60)} 小时`;
}

// ============================================================
// Service
// ============================================================

export const missionEngineService = {
  // ----------------------------------------------------------
  // getOrCreateUserProgress
  // Ensures a UserProgress record exists for the given user.
  // Creates one with default beginner state if not found.
  // ----------------------------------------------------------
  async getOrCreateUserProgress(userId: string, tenantId: string) {
    let progress = await prisma.userProgress.findUnique({
      where: { userId },
    });

    if (!progress) {
      const firstStage = ALL_STAGES[0]; // account_approved
      progress = await prisma.userProgress.create({
        data: {
          tenantId,
          userId,
          currentStageId: firstStage?.id ?? 'account_approved',
          completedChecks: [
            { check: 'account_approved', completed_at: new Date().toISOString() },
          ],
          totalXp: firstStage?.xp ?? 10,
          mode: 'beginner',
        },
      });
    }

    return progress;
  },

  // ----------------------------------------------------------
  // getCurrentMission
  // Returns the current mission state for display on the dashboard.
  // ----------------------------------------------------------
  async getCurrentMission(userId: string, tenantId: string): Promise<CurrentMission> {
    const progress = await this.getOrCreateUserProgress(userId, tenantId);
    const entries = normalizeCompletedChecks(progress.completedChecks);
    const checkKeys = extractCheckKeys(entries);
    const nextStage = getNextStage(checkKeys);
    const currentStage = nextStage ?? null;

    const remainingMinutes = currentStage
      ? estimateMinutesRemaining(checkKeys)
      : 0;

    return {
      stage: currentStage,
      progressPercent: getProgressPercent(checkKeys),
      totalXP: getTotalXP(checkKeys),
      completedCheckKeys: checkKeys,
      mode: progress.mode as UserMode,
      isJourneyComplete: nextStage === null && checkKeys.length >= ALL_STAGES.length,
      estimatedMinutesToComplete: remainingMinutes,
    };
  },

  // ----------------------------------------------------------
  // getMissionProgress
  // Returns detailed progress statistics.
  // ----------------------------------------------------------
  async getMissionProgress(userId: string, tenantId: string): Promise<MissionProgress> {
    const progress = await this.getOrCreateUserProgress(userId, tenantId);
    const entries = normalizeCompletedChecks(progress.completedChecks);
    const checkKeys = extractCheckKeys(entries);
    const nextStage = getNextStage(checkKeys);
    const totalStages = getTotalStages();
    const completedStages = ALL_STAGES.filter(
      (s) => s.id !== 'account_approved' && checkKeys.includes(s.completionCheck),
    ).length;

    return {
      currentStageId: progress.currentStageId,
      nextStageId: nextStage?.id ?? null,
      progressPercent: getProgressPercent(checkKeys),
      totalXP: getTotalXP(checkKeys),
      completedChecks: checkKeys,
      totalStages,
      completedStages,
      mode: progress.mode as UserMode,
      isJourneyComplete: nextStage === null && checkKeys.length >= ALL_STAGES.length,
    };
  },

  // ----------------------------------------------------------
  // completeCurrentMission
  // Marks a mission stage as complete.
  // - Validates that stageId is a real stage
  // - Appends to completedChecks
  // - Creates/updates a Mission record in the missions table
  // - Awards XP
  // - Checks and unlocks achievements
  // - Auto-advances to next stage
  // Returns the result with next mission info.
  // ----------------------------------------------------------
  async completeCurrentMission(
    userId: string,
    tenantId: string,
    stageId: MissionStageId,
  ): Promise<CompleteMissionResult> {
    const stage = getStageById(stageId);
    if (!stage) {
      throw new Error(`Unknown stage: ${stageId}`);
    }

    const progress = await this.getOrCreateUserProgress(userId, tenantId);
    const entries = normalizeCompletedChecks(progress.completedChecks);
    const checkKeys = new Set(extractCheckKeys(entries));

    // Prevent double-completion
    if (checkKeys.has(stage.completionCheck)) {
      const nextStage = getNextStage([...checkKeys]);
      return {
        completedStage: stage,
        nextStage,
        progressPercent: getProgressPercent([...checkKeys]),
        totalXP: getTotalXP([...checkKeys]),
        newAchievements: [],
        isJourneyComplete: nextStage === null,
      };
    }

    // Add the completed check
    checkKeys.add(stage.completionCheck);
    entries.push({ check: stage.completionCheck, completed_at: new Date().toISOString() });

    // Special case: first_sale auto-completes growth_mode
    if (stageId === 'first_sale') {
      const growthStage = getStageById('growth_mode');
      if (growthStage && !checkKeys.has(growthStage.completionCheck)) {
        checkKeys.add(growthStage.completionCheck);
        entries.push({ check: growthStage.completionCheck, completed_at: new Date().toISOString() });
      }
    }

    const allCheckKeys = [...checkKeys];
    const nextStage = getNextStage(allCheckKeys);
    const totalXp = getTotalXP(allCheckKeys);

    // Update UserProgress
    await prisma.userProgress.update({
      where: { userId },
      data: {
        completedChecks: entries,
        totalXp,
        currentStageId: nextStage?.id ?? 'growth_mode',
        stageStartedAt: new Date(),
        lastActivityAt: new Date(),
      },
    });

    // Create or update Mission record
    const existingMission = await prisma.mission.findFirst({
      where: { tenantId, userId, stageId },
    });
    if (existingMission) {
      await prisma.mission.update({
        where: { id: existingMission.id },
        data: { status: 'completed', completedAt: new Date() },
      });
    } else {
      await prisma.mission.create({
        data: {
          tenantId,
          userId,
          stageId,
          title: stage.title,
          description: stage.description,
          whyItMatters: stage.whyItMatters,
          estimatedMinutes: stage.estimatedMinutes,
          route: stage.route,
          status: 'completed',
          completedAt: new Date(),
        },
      });
    }

    // Create next unlocked mission record if applicable
    if (nextStage && stage.unlocksNextStage) {
      const existingNextMission = await prisma.mission.findFirst({
        where: { tenantId, userId, stageId: nextStage.id },
      });
      if (!existingNextMission) {
        await prisma.mission.create({
          data: {
            tenantId,
            userId,
            stageId: nextStage.id,
            title: nextStage.title,
            description: nextStage.description,
            whyItMatters: nextStage.whyItMatters,
            estimatedMinutes: nextStage.estimatedMinutes,
            route: nextStage.route,
            status: 'pending',
          },
        });
      }
    }

    // Check and unlock achievements
    const minimalUser = createMinimalAuthUser(userId, tenantId);
    const newAchievements = await checkAndUnlockAchievements(minimalUser, allCheckKeys);

    return {
      completedStage: stage,
      nextStage,
      progressPercent: getProgressPercent(allCheckKeys),
      totalXP: totalXp,
      newAchievements,
      isJourneyComplete: nextStage === null,
    };
  },

  // ----------------------------------------------------------
  // unlockNextMission
  // Explicitly moves the user to the next mission stage.
  // Useful when a stage is unlocked programmatically rather than
  // by user completion (e.g., admin approval triggers).
  // ----------------------------------------------------------
  async unlockNextMission(userId: string, tenantId: string) {
    const progress = await this.getOrCreateUserProgress(userId, tenantId);
    const entries = normalizeCompletedChecks(progress.completedChecks);
    const checkKeys = extractCheckKeys(entries);
    const nextStage = getNextStage(checkKeys);

    if (!nextStage) {
      return { unlocked: false, nextStage: null };
    }

    // Update the current stage ID without marking anything complete
    await prisma.userProgress.update({
      where: { userId },
      data: {
        currentStageId: nextStage.id,
        lastActivityAt: new Date(),
      },
    });

    // Create pending mission record for the next stage
    const existingNextMission = await prisma.mission.findFirst({
      where: { tenantId, userId, stageId: nextStage.id },
    });
    if (!existingNextMission) {
      await prisma.mission.create({
        data: {
          tenantId,
          userId,
          stageId: nextStage.id,
          title: nextStage.title,
          description: nextStage.description,
          whyItMatters: nextStage.whyItMatters,
          estimatedMinutes: nextStage.estimatedMinutes,
          route: nextStage.route,
          status: 'pending',
        },
      });
    }

    return { unlocked: true, nextStage };
  },

  // ----------------------------------------------------------
  // awardAchievement
  // Awards a specific achievement to the user.
  // Deduplicates — does not award the same key twice.
  // ----------------------------------------------------------
  async awardAchievement(
    userId: string,
    tenantId: string,
    achievementKey: string,
  ): Promise<AchievementResult | null> {
    // Check if already awarded
    const existing = await prisma.achievement.findUnique({
      where: {
        tenantId_userId_key: { tenantId, userId, key: achievementKey },
      },
    });

    if (existing) return null;

    // Look up achievement definition
    const defs = getAllAchievementDefs();
    const def = defs.find((d) => d.key === achievementKey);

    const created = await prisma.achievement.create({
      data: {
        tenantId,
        userId,
        type: 'milestone',
        key: achievementKey,
        title: def?.title ?? achievementKey,
        description: def?.description ?? '',
        icon: def?.icon ?? 'trophy',
        xpAwarded: def?.xp ?? 0,
      },
    });

    return {
      id: created.id,
      key: created.key,
      title: created.title,
      description: created.description,
      icon: created.icon,
      xpAwarded: created.xpAwarded,
      unlockedAt: created.unlockedAt.toISOString(),
    };
  },

  // ----------------------------------------------------------
  // switchMissionMode
  // Switches the user between beginner and advanced mode.
  // - Beginner: one active mission at a time, guided flow
  // - Advanced: user can see all unlocked missions
  // ----------------------------------------------------------
  async switchMissionMode(
    userId: string,
    tenantId: string,
    mode: UserMode,
  ) {
    await this.getOrCreateUserProgress(userId, tenantId);

    const updated = await prisma.userProgress.update({
      where: { userId },
      data: {
        mode,
        lastActivityAt: new Date(),
      },
    });

    return {
      mode: updated.mode as UserMode,
      message:
        mode === 'beginner'
          ? 'Switched to beginner mode. One mission at a time.'
          : 'Switched to advanced mode. All unlocked missions are now available.',
    };
  },

  // ----------------------------------------------------------
  // getAchievements
  // Returns all unlocked achievements for the user.
  // ----------------------------------------------------------
  async getAchievements(userId: string, tenantId: string) {
    const minimalUser = createMinimalAuthUser(userId, tenantId);
    return getUserAchievements(minimalUser);
  },

  // ----------------------------------------------------------
  // getAllMissions
  // Returns all mission records for the user (both pending and completed).
  // ----------------------------------------------------------
  async getAllMissions(userId: string, tenantId: string) {
    return prisma.mission.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'asc' },
    });
  },

  // ----------------------------------------------------------
  // Utility: format minutes for display
  // ----------------------------------------------------------
  formatMinutes,
};
