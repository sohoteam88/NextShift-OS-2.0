import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  funnel: {
    findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(),
    create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), delete: vi.fn(), count: vi.fn(),
  },
  brandProfile: { findUnique: vi.fn() },
  user: { findUnique: vi.fn() },
  funnelTemplate: { findFirst: vi.fn() },
  tenant: { findUnique: vi.fn() },
}));

const quotaMocks = vi.hoisted(() => ({ checkFunnelQuota: vi.fn() }));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/tenant/services/quota-service', () => ({ quotaService: quotaMocks }));

import { funnelService } from '@/modules/funnel/services/funnel-service';

const makeUser = (overrides = {}) => ({
  id: 'user-1', email: 'test@test.com', tenantId: 'tenant-1',
  role: 'operator', name: 'Test', preferredLanguage: 'zh', status: 'active' as const,
  ...overrides,
});

describe('funnelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quotaMocks.checkFunnelQuota.mockResolvedValue(undefined);
    prismaMocks.funnel.findUnique.mockResolvedValue(null);
    prismaMocks.brandProfile.findUnique.mockResolvedValue({ version: 1 });
  });

  // ── createInternal ──
  describe('createInternal', () => {
    it('creates a funnel with quota check and proper slug', async () => {
      prismaMocks.funnel.create.mockResolvedValue({ id: 'f-1', title: 'Test Funnel', slug: 'test-funnel-a1b2' });
      const result = await funnelService.createInternal({
        tenantId: 'tenant-1', ownerId: 'user-1', title: 'Test Funnel', config: { type: 'landing', sections: [] },
      });
      expect(quotaMocks.checkFunnelQuota).toHaveBeenCalledWith('tenant-1');
      expect(prismaMocks.funnel.create).toHaveBeenCalled();
      expect(result.slug).toMatch(/^test-funnel-/);
    });

    it('throws when quota exceeded', async () => {
      quotaMocks.checkFunnelQuota.mockRejectedValue(new Error('QUOTA_EXCEEDED'));
      await expect(funnelService.createInternal({
        tenantId: 'tenant-1', ownerId: 'user-1', title: 'Test', config: {},
      })).rejects.toThrow('QUOTA_EXCEEDED');
    });
  });

  // ── create (user-facing) ──
  describe('create', () => {
    it('applies template when template_id provided', async () => {
      prismaMocks.funnelTemplate.findFirst.mockResolvedValue({ id: 't-1', config: { type: 'landing', sections: [{ type: 'hero' }] } });
      prismaMocks.funnel.create.mockResolvedValue({ id: 'f-1', title: 'From Template', slug: 'from-template-xyz' });
      await funnelService.create(makeUser(), { title: 'From Template', template_id: 't-1' });
      expect(prismaMocks.funnelTemplate.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 't-1' }) }));
    });

    it('throws when template not found', async () => {
      prismaMocks.funnelTemplate.findFirst.mockResolvedValue(null);
      await expect(funnelService.create(makeUser(), { title: 'Test', template_id: 'bad-id' }))
        .rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });

  // ── publish ──
  describe('publish', () => {
    it('validates hero + CTA sections', async () => {
      prismaMocks.funnel.findFirst.mockResolvedValue({ id: 'f-1', tenantId: 'tenant-1', ownerId: 'user-1', config: { sections: [] } });
      await expect(funnelService.publish(makeUser(), 'f-1'))
        .rejects.toMatchObject({ code: 'VALIDATION_ERROR', message: expect.stringContaining('hero') });
    });

    it('publishes when config is valid', async () => {
      prismaMocks.funnel.findFirst.mockResolvedValue({
        id: 'f-1', tenantId: 'tenant-1', ownerId: 'user-1',
        config: { sections: [{ type: 'hero' }, { type: 'cta' }] },
      });
      prismaMocks.funnel.update.mockResolvedValue({ id: 'f-1', status: 'published' });
      const result = await funnelService.publish(makeUser(), 'f-1');
      expect(result.status).toBe('published');
      expect(prismaMocks.funnel.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          config: expect.objectContaining({ brandDnaVersion: 1 }),
        }),
      }));
    });
  });

  // ── access control ──
  describe('access control', () => {
    it('member cannot access another user\'s funnel', async () => {
      prismaMocks.funnel.findFirst.mockResolvedValue({ id: 'f-1', tenantId: 'tenant-1', ownerId: 'other-user' });
      await expect(funnelService.getById(makeUser({ role: 'member' }), 'f-1'))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('operator can access any funnel in tenant', async () => {
      prismaMocks.funnel.findFirst.mockResolvedValue({ id: 'f-1', tenantId: 'tenant-1', ownerId: 'other-user' });
      const result = await funnelService.getById(makeUser({ role: 'operator' }), 'f-1');
      expect(result.id).toBe('f-1');
    });
  });

  // ── delete ──
  describe('delete', () => {
    it('deletes and returns confirmation', async () => {
      prismaMocks.funnel.findFirst.mockResolvedValue({ id: 'f-1', tenantId: 'tenant-1', ownerId: 'user-1' });
      const result = await funnelService.delete(makeUser(), 'f-1');
      expect(result).toEqual({ deleted: true });
      expect(prismaMocks.funnel.delete).toHaveBeenCalledWith({ where: { id: 'f-1' } });
    });
  });

  // ── trackView ──
  describe('trackView', () => {
    it('increments view counter', async () => {
      await funnelService.trackView('f-1');
      expect(prismaMocks.funnel.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: { views: { increment: 1 } } }),
      );
    });
  });
});
