import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

const prismaMocks = vi.hoisted(() => ({
  $transaction: vi.fn(),
  $queryRaw: vi.fn(),
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  videoProject: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
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
const aiSuccess = <T,>(value: T) => ({ status: 'success' as const, source: 'ai' as const, value, text: '', result: {} });

describe('E3A capability revalidation', () => {
  let userMetadata: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    userMetadata = {};
    prismaMocks.$transaction.mockImplementation(async (callback: (tx: typeof prismaMocks) => Promise<unknown>) => callback(prismaMocks));
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
    prismaMocks.$queryRaw.mockImplementation(async (query: { values?: unknown[] }) => {
      const json = query.values?.find((value) => typeof value === 'string' && value.startsWith('{') && value.includes('"id"'));
      if (typeof json === 'string') {
        const value = JSON.parse(json) as Record<string, unknown>;
        if (value.track === 'retail' || value.track === 'recruitment') {
          userMetadata = { ...userMetadata, ...(value.track === 'retail' ? { lead_magnet: value } : {}), lead_magnet_tracks: { ...((userMetadata.lead_magnet_tracks as Record<string, unknown>) ?? {}), [value.track]: value } };
        } else if ('topic' in value) userMetadata = { ...userMetadata, webinar: value };
      }
      return [{ id: user.id }];
    });
  });

  describe('latest planning baseline delta after U3B', () => {
    it('pins the post-E3B authorities while retaining deleted-tenant publish guards', () => {
      const leadMagnetPublish = readFileSync(
        'src/app/api/v1/lead-magnet/publish/route.ts',
        'utf8',
      );
      const videoPublish = readFileSync(
        'src/app/api/v1/video/projects/[id]/publish/route.ts',
        'utf8',
      );
      const leadMagnetServiceSource = readFileSync(
        'src/modules/lead-magnet/leadMagnetService.ts',
        'utf8',
      );
      const webinarDashboard = readFileSync(
        'src/modules/webinar-center/components/WebinarDashboard.tsx',
        'utf8',
      );
      const masterScriptEditor = readFileSync(
        'src/modules/video/components/MasterScriptEditor.tsx',
        'utf8',
      );
      const productionPlan = readFileSync(
        'src/modules/video/components/ProductionPlanView.tsx',
        'utf8',
      );
      const subtitleView = readFileSync(
        'src/modules/video/components/SubtitleView.tsx',
        'utf8',
      );

      for (const route of [leadMagnetPublish, videoPublish]) {
        expect(route).toContain("assertTenantOperational(user.tenantId, 'claim')");
        expect(route).toContain(
          "assertTenantOperational(user.tenantId, 'pre_side_effect')",
        );
      }

      expect(leadMagnetServiceSource).toContain('jsonb_set');
      expect(webinarDashboard).toContain('regenerationIssue');
      expect(webinarDashboard).toContain('重新生成 Webinar');
      expect(webinarDashboard).toContain('重试重新生成');
      expect(webinarDashboard).toContain('重新检查状态');
      expect(masterScriptEditor).toContain('ClipboardButton');
      expect(productionPlan).toContain('ClipboardButton');
      expect(subtitleView).toContain('ClipboardButton');
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

    it('saves and reopens exact Retail and Recruitment records when writes are sequential', async () => {
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
      expect(prismaMocks.$transaction).toHaveBeenCalledTimes(2);
      expect(prismaMocks.$queryRaw).toHaveBeenCalledTimes(4);
    });

    it('preserves both tracks under concurrent atomic writes', async () => {
      userMetadata = {
        unrelated_preference: { locale: 'zh-MY' },
        lead_magnet_tracks: {},
      };
      const retail = { ...generateLeadMagnet(brandContext as never, 'guide'), track: 'retail' as const };
      const recruitment = { ...generateLeadMagnet(brandContext as never, 'checklist'), track: 'recruitment' as const };

      await Promise.all([
        leadMagnetService.saveTrack(user.id, 'retail', retail),
        leadMagnetService.saveTrack(user.id, 'recruitment', recruitment),
      ]);
      prismaMocks.user.findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => (
        where.id === user.id ? { metadata: userMetadata } : null
      ));
      const reopened = await leadMagnetService.getTracks(user.id);

      expect(prismaMocks.$transaction).toHaveBeenCalledTimes(2);
      expect(prismaMocks.$queryRaw).toHaveBeenCalledTimes(4);
      expect(reopened.retail?.id).toBe(retail.id);
      expect(reopened.recruitment?.id).toBe(recruitment.id);
      expect(userMetadata.unrelated_preference).toEqual({ locale: 'zh-MY' });
    });
  });

  describe('Webinar singleton lifecycle', () => {
    it('generates a canonical record identity and timestamps', () => {
      const generated = generateFullWebinar(brandContext as never);

      expect(generated.status).toBe('generated');
      expect(generated.topic.title).toContain('Steven');
      expect(generated.id).toMatch(/^webinar-/);
      expect(generated.createdAt).toBeTruthy();
      expect(generated.updatedAt).toBeTruthy();
    });

    it('round-trips the same singleton identity through user metadata', async () => {
      const generated = generateFullWebinar(brandContext as never);

      await webinarService.save(user.id, generated);
      const reopened = await webinarService.get(user.id);

      expect(reopened).toEqual(generated);
      expect(reopened?.id).toBe(generated.id);
      expect(prismaMocks.$queryRaw).toHaveBeenCalled();
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
      videoStrategyMocks.buildStrategy.mockResolvedValue(aiSuccess({ recommended_angle: 'Founder lesson' }));
      masterScriptMocks.generateHook.mockResolvedValue(aiSuccess({ selected: 'A', options: [] }));
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

    it('binds exact-project reopen to tenant and owner', async () => {
      prismaMocks.videoProject.findFirst.mockResolvedValue({
        id: 'video-project-owned-by-another-member',
        tenantId: user.tenantId,
        userId: 'user-b',
      });

      const reopened = await videoProjectService.get(user, 'video-project-owned-by-another-member');

      expect(reopened).toEqual(expect.objectContaining({ userId: 'user-b' }));
      expect(prismaMocks.videoProject.findFirst).toHaveBeenCalledWith({
        where: { id: 'video-project-owned-by-another-member', tenantId: user.tenantId, userId: user.id },
      });
    });

    it('binds scene persistence to tenant and owner', async () => {
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
      masterScriptMocks.regenerateScene.mockResolvedValue(aiSuccess(replacement));
      prismaMocks.videoProject.updateMany.mockResolvedValue({ count: 1 });

      await videoProjectService.regenerateScene(
        user,
        'video-project-owned-by-another-member',
        1,
        'make it clearer',
      );

      expect(prismaMocks.videoProject.findFirst).toHaveBeenCalledWith({
        where: { id: 'video-project-owned-by-another-member', tenantId: user.tenantId, userId: user.id },
      });
      expect(prismaMocks.videoProject.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'video-project-owned-by-another-member', tenantId: user.tenantId, userId: user.id },
      }));
    });
  });
});
