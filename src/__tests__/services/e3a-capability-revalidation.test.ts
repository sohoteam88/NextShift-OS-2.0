import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  videoProject: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
}));
const videoStrategyMocks = vi.hoisted(() => ({ buildStrategy: vi.fn() }));
const masterScriptMocks = vi.hoisted(() => ({
  generateHook: vi.fn(),
  generateScript: vi.fn(),
  regenerateScene: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/video/services/video-strategy-service', () => ({
  videoStrategyService: videoStrategyMocks,
}));
vi.mock('@/modules/video/services/master-script-service', () => ({
  masterScriptService: masterScriptMocks,
}));
vi.mock('@/modules/mission/utils/complete-mission', () => ({
  notifyMissionProgress: vi.fn(),
}));

import { generateLeadMagnet } from '@/modules/lead-magnet/leadMagnetGenerators';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';
import type { LeadMagnetConfig } from '@/modules/lead-magnet/types';
import { videoProjectService } from '@/modules/video/services/video-project-service';
import { generateFullWebinar } from '@/modules/webinar-center/webinarGenerators';
import { webinarService } from '@/modules/webinar-center/webinarService';

const user = {
  id: 'user-a',
  tenantId: 'tenant-a',
  email: 'member@example.test',
  role: 'member' as const,
  name: 'Member',
  preferredLanguage: 'zh',
  status: 'active' as const,
};

const brandContext = {
  personalName: 'Steven',
  brandName: 'NextShift',
  positioning: 'AI business operator',
  audience: 'small-business owners',
  audiencePainPoints: ['no repeatable growth system'],
  messaging: {
    coreMessage: 'Build a repeatable system',
    uniqueAngle: 'business-state first',
    elevatorPitch: 'Operate with one clear next action',
  },
  offer: {
    primary: 'growth operating system',
    transformation: 'move from fragmented work to repeatable growth',
  },
};

describe('E3A capability revalidation', () => {
  let userMetadata: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    userMetadata = {};
    prismaMocks.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => (
      where.id === user.id ? { metadata: userMetadata } : null
    ));
    prismaMocks.user.update.mockImplementation(async ({ where, data }: {
      where: { id: string };
      data: { metadata: Record<string, unknown> };
    }) => {
      expect(where.id).toBe(user.id);
      userMetadata = data.metadata;
      return { id: where.id, metadata: userMetadata };
    });
  });

  describe('Lead Magnet canonical user-metadata lifecycle', () => {
    it('generates a stable record identity with timestamps', () => {
      const generated = generateLeadMagnet(brandContext as never, 'guide');

      expect(generated.id).toMatch(/^lm-\d+$/);
      expect(new Date(generated.createdAt).toISOString()).toBe(generated.createdAt);
      expect(new Date(generated.updatedAt).toISOString()).toBe(generated.updatedAt);
      expect(generated.status).toBe('generated');
    });

    it('saves and reopens the exact Retail and Recruitment records for the current user', async () => {
      const retail = { ...generateLeadMagnet(brandContext as never, 'guide'), track: 'retail' as const };
      const recruitment = { ...generateLeadMagnet(brandContext as never, 'checklist'), track: 'recruitment' as const };

      await leadMagnetService.saveTrack(user.id, 'retail', retail);
      await leadMagnetService.saveTrack(user.id, 'recruitment', recruitment);
      const reopened = await leadMagnetService.getTracks(user.id);

      expect(reopened.retail).toEqual(retail);
      expect(reopened.recruitment).toEqual(recruitment);
      expect(prismaMocks.user.findUnique).toHaveBeenCalledWith({
        where: { id: user.id },
        select: { metadata: true },
      });
      expect(prismaMocks.user.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('Webinar singleton lifecycle', () => {
    it('deterministically exposes the missing canonical record identity', () => {
      const generated = generateFullWebinar(brandContext as never);

      expect(generated.status).toBe('generated');
      expect(generated.topic.title).toContain('Steven');
      expect(generated).not.toHaveProperty('id');
      expect(generated).not.toHaveProperty('createdAt');
      expect(generated).not.toHaveProperty('updatedAt');
    });

    it('round-trips the singleton through the authenticated user metadata without inventing an ID', async () => {
      const generated = generateFullWebinar(brandContext as never);

      await webinarService.save(user.id, generated);
      const reopened = await webinarService.get(user.id);

      expect(reopened).toEqual(generated);
      expect(reopened).not.toHaveProperty('id');
      expect(prismaMocks.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: user.id },
      }));
    });
  });

  describe('Video project identity and authorization boundaries', () => {
    const input = {
      topic: 'Founder story',
      content_pillar: 'authority',
      audience_pain: 'unclear positioning',
      funnel_stage: 'cold_audience' as const,
      platform: 'instagram_reel' as const,
      duration: '60s' as const,
      style: 'talking_head' as const,
    };

    it('creates a stable canonical VideoProject owned by the authenticated tenant and user', async () => {
      videoStrategyMocks.buildStrategy.mockResolvedValue({ recommended_angle: 'Founder lesson' });
      masterScriptMocks.generateHook.mockResolvedValue({ selected: 'A', options: [] });
      prismaMocks.videoProject.create.mockResolvedValue({ id: 'video-project-1' });

      const result = await videoProjectService.startProject(user, input);

      expect(result.project).toEqual({ id: 'video-project-1' });
      expect(prismaMocks.videoProject.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          tenantId: user.tenantId,
          userId: user.id,
          topic: input.topic,
          status: 'draft',
        }),
      }));
    });

    it('scopes list and delete to both tenant and owner', async () => {
      prismaMocks.videoProject.findMany.mockResolvedValue([]);
      prismaMocks.videoProject.deleteMany.mockResolvedValue({ count: 1 });

      await videoProjectService.list(user);
      await videoProjectService.delete(user, 'video-project-1');

      expect(prismaMocks.videoProject.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { tenantId: user.tenantId, userId: user.id },
      }));
      expect(prismaMocks.videoProject.deleteMany).toHaveBeenCalledWith({
        where: { id: 'video-project-1', tenantId: user.tenantId, userId: user.id },
      });
    });

    it('reproduces the owner-boundary gap on exact-project reopen', async () => {
      prismaMocks.videoProject.findFirst.mockResolvedValue({
        id: 'video-project-owned-by-another-member',
        tenantId: user.tenantId,
        userId: 'user-b',
      });

      const reopened = await videoProjectService.get(user, 'video-project-owned-by-another-member');

      expect(reopened).toEqual(expect.objectContaining({ userId: 'user-b' }));
      expect(prismaMocks.videoProject.findFirst).toHaveBeenCalledWith({
        where: { id: 'video-project-owned-by-another-member', tenantId: user.tenantId },
      });
    });

    it('reproduces the same owner-boundary gap before a scene update is persisted', async () => {
      const originalScene = {
        scene_number: 1,
        time_range: '0-5s',
        purpose: 'hook',
        visual: 'before',
        text_overlay: 'before',
        voiceover: 'before',
        emotion: 'curious',
      };
      const replacement = { ...originalScene, visual: 'after' };
      prismaMocks.videoProject.findFirst.mockResolvedValue({
        id: 'video-project-owned-by-another-member',
        tenantId: user.tenantId,
        userId: 'user-b',
        masterScript: { scenes: [originalScene], cta: originalScene },
      });
      masterScriptMocks.regenerateScene.mockResolvedValue(replacement);
      prismaMocks.videoProject.update.mockResolvedValue({ id: 'video-project-owned-by-another-member' });

      await videoProjectService.regenerateScene(
        user,
        'video-project-owned-by-another-member',
        1,
        'make it clearer',
      );

      expect(prismaMocks.videoProject.findFirst).toHaveBeenCalledWith({
        where: { id: 'video-project-owned-by-another-member', tenantId: user.tenantId },
      });
      expect(prismaMocks.videoProject.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'video-project-owned-by-another-member' },
      }));
    });
  });
});
