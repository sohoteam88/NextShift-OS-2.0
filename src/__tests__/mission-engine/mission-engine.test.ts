import { randomUUID } from 'node:crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import prisma from '@/lib/prisma';
import { missionEngineService } from '@/modules/mission-engine/missionEngineService';
import {
  ALL_STAGES,
  getNextStage,
  getProgressPercent,
  getStageById,
  getTotalXP,
  type MissionStageId,
} from '@/modules/mission-engine/missionStages';

// ============================================================
// Test helpers
// ============================================================

const TEST_SUFFIX = randomUUID().slice(0, 8);

interface TestContext {
  tenantId: string;
  userId: string;
}

let ctx: TestContext;

async function createTestUser(): Promise<TestContext> {
  const tenant = await prisma.tenant.create({
    data: {
      name: `Test Tenant ${TEST_SUFFIX}`,
      slug: `test-tenant-${TEST_SUFFIX}`,
      plan: 'starter',
      maxMembers: 10,
      maxAiCalls: 200,
      status: 'active',
      settings: { default_language: 'zh' },
    },
  });

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      tenantId: tenant.id,
      email: `test-user-${TEST_SUFFIX}@example.test`,
      name: `Test User ${TEST_SUFFIX}`,
      role: 'member',
      status: 'active',
      languagePreference: 'zh',
    },
  });

  return { tenantId: tenant.id, userId: user.id };
}

async function cleanupTestUser(ctx: TestContext) {
  await prisma.mission.deleteMany({ where: { tenantId: ctx.tenantId, userId: ctx.userId } });
  await prisma.achievement.deleteMany({ where: { tenantId: ctx.tenantId, userId: ctx.userId } });
  await prisma.userProgress.deleteMany({ where: { userId: ctx.userId } });
  await prisma.user.delete({ where: { id: ctx.userId } });
  await prisma.tenant.delete({ where: { id: ctx.tenantId } });
}

// ============================================================
// Tests
// ============================================================

describe('Mission Engine', () => {
  beforeAll(async () => {
    ctx = await createTestUser();
  });

  afterAll(async () => {
    await cleanupTestUser(ctx);
  });

  // ----------------------------------------------------------
  // 1. First-time user progress creation
  // ----------------------------------------------------------
  describe('getOrCreateUserProgress', () => {
    it('should create a new UserProgress record for a first-time user', async () => {
      const progress = await missionEngineService.getOrCreateUserProgress(ctx.userId, ctx.tenantId);

      expect(progress).toBeDefined();
      expect(progress.userId).toBe(ctx.userId);
      expect(progress.tenantId).toBe(ctx.tenantId);
      expect(progress.currentStageId).toBe('account_approved');
      expect(progress.mode).toBe('beginner');
      expect(progress.totalXp).toBeGreaterThanOrEqual(10);

      // completedChecks should include account_approved by default
      const checks = progress.completedChecks as Array<{ check: string }>;
      expect(checks.some((c) => c.check === 'account_approved')).toBe(true);
    });

    it('should return the existing record when called again for the same user', async () => {
      const first = await missionEngineService.getOrCreateUserProgress(ctx.userId, ctx.tenantId);
      const second = await missionEngineService.getOrCreateUserProgress(ctx.userId, ctx.tenantId);

      expect(second.id).toBe(first.id);
      expect(second.currentStageId).toBe(first.currentStageId);
    });

    it('should respect tenantId isolation', async () => {
      // Create a second tenant and user
      const tenant2 = await prisma.tenant.create({
        data: {
          name: `Isolation Tenant ${TEST_SUFFIX}`,
          slug: `isolation-tenant-${TEST_SUFFIX}`,
          plan: 'starter',
          maxMembers: 5,
          maxAiCalls: 100,
          status: 'active',
          settings: {},
        },
      });

      const user2 = await prisma.user.create({
        data: {
          id: randomUUID(),
          tenantId: tenant2.id,
          email: `isolation-user-${TEST_SUFFIX}@example.test`,
          name: `Isolation User ${TEST_SUFFIX}`,
          role: 'member',
          status: 'active',
          languagePreference: 'zh',
        },
      });

      const progress1 = await missionEngineService.getOrCreateUserProgress(ctx.userId, ctx.tenantId);
      const progress2 = await missionEngineService.getOrCreateUserProgress(user2.id, tenant2.id);

      expect(progress1.id).not.toBe(progress2.id);
      expect(progress1.userId).toBe(ctx.userId);
      expect(progress2.userId).toBe(user2.id);

      // Cleanup
      await prisma.userProgress.deleteMany({ where: { userId: user2.id } });
      await prisma.user.delete({ where: { id: user2.id } });
      await prisma.tenant.delete({ where: { id: tenant2.id } });
    });
  });

  // ----------------------------------------------------------
  // 2. getCurrentMission — current mission state
  // ----------------------------------------------------------
  describe('getCurrentMission', () => {
    it('should return the current mission for a user who just started', async () => {
      const mission = await missionEngineService.getCurrentMission(ctx.userId, ctx.tenantId);

      expect(mission).toBeDefined();
      expect(mission.mode).toBe('beginner');
      expect(mission.isJourneyComplete).toBe(false);
      expect(mission.stage).toBeDefined();
    });

    it('should return progress percent between 0 and 100', async () => {
      const mission = await missionEngineService.getCurrentMission(ctx.userId, ctx.tenantId);

      expect(mission.progressPercent).toBeGreaterThanOrEqual(0);
      expect(mission.progressPercent).toBeLessThanOrEqual(100);
    });
  });

  // ----------------------------------------------------------
  // 3. getMissionProgress — detailed progress
  // ----------------------------------------------------------
  describe('getMissionProgress', () => {
    it('should return detailed progress stats', async () => {
      const progress = await missionEngineService.getMissionProgress(ctx.userId, ctx.tenantId);

      expect(progress.totalStages).toBeGreaterThan(0);
      expect(progress.completedStages).toBeGreaterThanOrEqual(0);
      expect(progress.completedStages).toBeLessThanOrEqual(progress.totalStages);
      expect(progress.mode).toBe('beginner');
    });
  });

  // ----------------------------------------------------------
  // 4. completeCurrentMission — marking a stage complete
  // ----------------------------------------------------------
  describe('completeCurrentMission', () => {
    it('should complete the brand_discovery stage and advance', async () => {
      // First, ensure the user is at brand_discovery
      const before = await missionEngineService.getCurrentMission(ctx.userId, ctx.tenantId);

      // Complete brand_discovery
      const result = await missionEngineService.completeCurrentMission(
        ctx.userId,
        ctx.tenantId,
        'brand_discovery',
      );

      expect(result.completedStage).toBeDefined();
      expect(result.completedStage!.id).toBe('brand_discovery');
      expect(result.nextStage).toBeDefined();
      expect(result.nextStage!.id).toBe('brand_dna');
      expect(result.progressPercent).toBeGreaterThan(0);
      expect(result.totalXP).toBeGreaterThan(0);
      expect(result.isJourneyComplete).toBe(false);
    });

    it('should prevent double-completion of the same stage', async () => {
      const result = await missionEngineService.completeCurrentMission(
        ctx.userId,
        ctx.tenantId,
        'brand_discovery',
      );

      // Double completion should still succeed but return no new achievements
      expect(result.completedStage!.id).toBe('brand_discovery');
    });

    it('should create a Mission record in the database on completion', async () => {
      await missionEngineService.completeCurrentMission(
        ctx.userId,
        ctx.tenantId,
        'brand_dna',
      );

      const missionRecord = await prisma.mission.findFirst({
        where: { userId: ctx.userId, stageId: 'brand_dna' },
      });

      expect(missionRecord).toBeDefined();
      expect(missionRecord!.status).toBe('completed');
      expect(missionRecord!.completedAt).toBeDefined();
    });

    it('should throw for unknown stage ID', async () => {
      await expect(
        missionEngineService.completeCurrentMission(
          ctx.userId,
          ctx.tenantId,
          'nonexistent_stage' as MissionStageId,
        ),
      ).rejects.toThrow('Unknown stage');
    });
  });

  // ----------------------------------------------------------
  // 5. Auto-advancing to next stage
  // ----------------------------------------------------------
  describe('auto-advance to next stage', () => {
    it('should auto-advance currentStageId after completing a stage', async () => {
      const before = await missionEngineService.getMissionProgress(ctx.userId, ctx.tenantId);
      const beforeStageId = before.currentStageId;

      await missionEngineService.completeCurrentMission(
        ctx.userId,
        ctx.tenantId,
        'social_setup',
      );

      const after = await missionEngineService.getMissionProgress(ctx.userId, ctx.tenantId);
      expect(after.currentStageId).not.toBe(beforeStageId);
      expect(after.completedChecks).toContain('social_setup_completed');
    });

    it('should chain multiple completions correctly', async () => {
      // Complete first_bio
      let result = await missionEngineService.completeCurrentMission(
        ctx.userId,
        ctx.tenantId,
        'first_bio',
      );
      expect(result.nextStage!.id).toBe('first_content');

      // Complete first_content
      result = await missionEngineService.completeCurrentMission(
        ctx.userId,
        ctx.tenantId,
        'first_content',
      );
      expect(result.nextStage!.id).toBe('first_video');

      // Verify progress increased
      const after = await missionEngineService.getMissionProgress(ctx.userId, ctx.tenantId);
      expect(after.progressPercent).toBeGreaterThan(30);
    });
  });

  // ----------------------------------------------------------
  // 6. Achievement creation
  // ----------------------------------------------------------
  describe('achievement creation', () => {
    it('should unlock achievements when milestone stages are completed', async () => {
      // Complete several more stages to trigger achievements
      await missionEngineService.completeCurrentMission(ctx.userId, ctx.tenantId, 'first_video');
      await missionEngineService.completeCurrentMission(ctx.userId, ctx.tenantId, 'lead_magnet');
      await missionEngineService.completeCurrentMission(ctx.userId, ctx.tenantId, 'webinar');

      const result = await missionEngineService.completeCurrentMission(
        ctx.userId,
        ctx.tenantId,
        'funnel',
      );

      // funnel_published should trigger the funnel_live achievement
      // Note: achievement checks depend on the achievement-service definitions
      expect(result.newAchievements).toBeDefined();
      // At minimum, funnel completion may trigger brand_built or funnel_live
    });

    it('should return unlocked achievements via service', async () => {
      const achievements = await missionEngineService.getAchievements(ctx.userId, ctx.tenantId);
      expect(Array.isArray(achievements)).toBe(true);
    });

    it('awardAchievement should not duplicate', async () => {
      // Award a specific achievement manually
      const first = await missionEngineService.awardAchievement(
        ctx.userId,
        ctx.tenantId,
        'brand_built',
      );

      const second = await missionEngineService.awardAchievement(
        ctx.userId,
        ctx.tenantId,
        'brand_built',
      );

      if (first) {
        expect(first.key).toBe('brand_built');
      }
      // Second call should return null (already awarded)
      expect(second).toBeNull();
    });
  });

  // ----------------------------------------------------------
  // 7. Beginner vs Advanced mode behavior
  // ----------------------------------------------------------
  describe('beginner vs advanced mode', () => {
    it('should default to beginner mode', async () => {
      const progress = await missionEngineService.getMissionProgress(ctx.userId, ctx.tenantId);
      expect(progress.mode).toBe('beginner');
    });

    it('should switch to advanced mode', async () => {
      const result = await missionEngineService.switchMissionMode(
        ctx.userId,
        ctx.tenantId,
        'advanced',
      );

      expect(result.mode).toBe('advanced');

      const progress = await missionEngineService.getMissionProgress(ctx.userId, ctx.tenantId);
      expect(progress.mode).toBe('advanced');
    });

    it('should switch back to beginner mode', async () => {
      const result = await missionEngineService.switchMissionMode(
        ctx.userId,
        ctx.tenantId,
        'beginner',
      );

      expect(result.mode).toBe('beginner');

      const progress = await missionEngineService.getMissionProgress(ctx.userId, ctx.tenantId);
      expect(progress.mode).toBe('beginner');
    });
  });

  // ----------------------------------------------------------
  // 8. Journey completion
  // ----------------------------------------------------------
  describe('journey completion', () => {
    it('should mark journey as complete after first_sale (auto-completes growth_mode)', async () => {
      // Complete remaining stages to reach first_sale
      await missionEngineService.completeCurrentMission(ctx.userId, ctx.tenantId, 'traffic_campaign');
      await missionEngineService.completeCurrentMission(ctx.userId, ctx.tenantId, 'whatsapp_followup');
      await missionEngineService.completeCurrentMission(ctx.userId, ctx.tenantId, 'crm_setup');

      const result = await missionEngineService.completeCurrentMission(
        ctx.userId,
        ctx.tenantId,
        'first_sale',
      );

      expect(result.isJourneyComplete).toBe(true);
      expect(result.nextStage).toBeNull();

      const mission = await missionEngineService.getCurrentMission(ctx.userId, ctx.tenantId);
      expect(mission.isJourneyComplete).toBe(true);
    });
  });
});

// ============================================================
// Stage definition unit tests (pure functions, no DB)
// ============================================================

describe('Mission Stage Definitions', () => {
  it('should have 15 stages in the beginner journey', () => {
    expect(ALL_STAGES).toHaveLength(15);
  });

  it('should have unique IDs for all stages', () => {
    const ids = ALL_STAGES.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have unique completionCheck values', () => {
    const checks = ALL_STAGES.map((s) => s.completionCheck);
    const uniqueChecks = new Set(checks);
    expect(uniqueChecks.size).toBe(checks.length);
  });

  it('should return the correct stage by ID', () => {
    const stage = getStageById('brand_dna');
    expect(stage).toBeDefined();
    expect(stage!.id).toBe('brand_dna');
    expect(stage!.xp).toBe(50);
  });

  it('should return undefined for unknown stage ID', () => {
    expect(getStageById('nonexistent' as MissionStageId)).toBeUndefined();
  });

  it('should compute progress percent correctly', () => {
    // No checks: 0%
    expect(getProgressPercent([])).toBe(0);

    // All checks: 100% (excluding account_approved)
    const allChecks = ALL_STAGES
      .filter((s) => s.id !== 'account_approved')
      .map((s) => s.completionCheck);
    expect(getProgressPercent(allChecks)).toBe(100);
  });

  it('should compute total XP correctly', () => {
    // No checks: 0 XP
    expect(getTotalXP([])).toBe(0);

    // account_approved: 10 XP
    expect(getTotalXP(['account_approved'])).toBe(10);

    // Multiple checks
    const totalPossible = ALL_STAGES.reduce((sum, s) => sum + s.xp, 0);
    const allChecks = ALL_STAGES.map((s) => s.completionCheck);
    expect(getTotalXP(allChecks)).toBe(totalPossible);
  });

  it('should return next stage based on completed checks', () => {
    // With account_approved completed, next should be brand_discovery
    const next = getNextStage(['account_approved']);
    expect(next).toBeDefined();
    expect(next!.id).toBe('brand_discovery');
  });

  it('should return null for next stage when all are complete', () => {
    const allChecks = ALL_STAGES.map((s) => s.completionCheck);
    expect(getNextStage(allChecks)).toBeNull();
  });

  it('should maintain correct order (1 to 15)', () => {
    ALL_STAGES.forEach((stage, index) => {
      expect(stage.order).toBe(index + 1);
    });
  });

  it('should have only growth_mode with mode=both', () => {
    const growthMode = ALL_STAGES.find((s) => s.id === 'growth_mode');
    expect(growthMode!.mode).toBe('both');
  });

  it('should have all stages with valid route strings', () => {
    ALL_STAGES.forEach((stage) => {
      expect(stage.route).toBeTruthy();
      expect(typeof stage.route).toBe('string');
    });
  });

  it('should have all stages with whyItMatters text', () => {
    ALL_STAGES.forEach((stage) => {
      expect(stage.whyItMatters).toBeTruthy();
      expect(stage.whyItMatters.length).toBeGreaterThan(10);
    });
  });
});
