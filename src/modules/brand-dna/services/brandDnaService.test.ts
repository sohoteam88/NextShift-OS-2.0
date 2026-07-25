import { describe, expect, it, vi } from 'vitest';
import { EMPTY_BRAND_DNA } from '../types';

const prismaMocks = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  brandProfile: { upsert: vi.fn(), findUnique: vi.fn() },
}));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));

import { brandDnaService } from './brandDnaService';
import { getBrandDnaVersion } from './BrandContextProvider';

describe('brand DNA versioning', () => {
  it('increments the canonical version on save and exposes it to downstream generation', async () => {
    prismaMocks.user.findUnique
      .mockResolvedValueOnce({ tenantId: 'tenant-1' })
      .mockResolvedValueOnce({ metadata: {} })
      .mockResolvedValueOnce({ metadata: {} });
    prismaMocks.user.update.mockResolvedValue({});
    prismaMocks.brandProfile.upsert.mockResolvedValue({});

    const saved = await brandDnaService.saveBrandDNA('user-1', {
      ...EMPTY_BRAND_DNA,
      meta: { ...EMPTY_BRAND_DNA.meta, version: 4 },
    });

    expect(saved.meta.version).toBe(5);
    expect(prismaMocks.brandProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({
      update: expect.objectContaining({ version: 5 }),
    }));

    prismaMocks.brandProfile.findUnique.mockResolvedValue({ version: 5 });
    await expect(getBrandDnaVersion('user-1')).resolves.toBe(5);
  });

  it('merges field provenance from metadata after loading the primary BrandProfile row', async () => {
    prismaMocks.brandProfile.findUnique.mockResolvedValue({
      ...EMPTY_BRAND_DNA.identity,
      tenantId: 'tenant-1', userId: 'user-1',
      audiencePainPoints: [], audienceGoals: [], audienceObjections: [], contentPillars: [], brandColors: ['#2563eb', '#1e40af'],
      coreMessage: '', uniqueAngle: '', elevatorPitch: '', contentTone: '温暖亲切', storytellingStyle: '',
      primaryOffer: '', secondaryOffer: '', transformationPromise: '', profileImagePrompt: '', coverBannerPrompt: '',
      confidenceScore: 0, version: 3, publishedAt: null, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02'),
    });
    prismaMocks.user.findUnique.mockResolvedValue({ metadata: { brand_dna_field_provenance: { 'identity.brandName': 'coach_defaulted' } } });

    await expect(brandDnaService.getBrandDNA('user-1')).resolves.toMatchObject({
      meta: { version: 3, fieldProvenance: { 'identity.brandName': 'coach_defaulted' } },
    });
  });

  it('increments once and makes a corrected field user-confirmed', async () => {
    prismaMocks.brandProfile.findUnique.mockResolvedValue({
      ...EMPTY_BRAND_DNA.identity,
      tenantId: 'tenant-1', userId: 'user-1',
      audiencePainPoints: [], audienceGoals: [], audienceObjections: [], contentPillars: [], brandColors: ['#2563eb', '#1e40af'],
      coreMessage: '', uniqueAngle: '', elevatorPitch: '教练默认的介绍', contentTone: '温暖亲切', storytellingStyle: '',
      primaryOffer: '', secondaryOffer: '', transformationPromise: '', profileImagePrompt: '', coverBannerPrompt: '',
      confidenceScore: 0, version: 3, publishedAt: null, createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-02'),
    });
    prismaMocks.user.findUnique
      .mockResolvedValueOnce({ metadata: { brand_dna_field_provenance: { 'messaging.elevatorPitch': 'coach_defaulted' } } })
      .mockResolvedValueOnce({ tenantId: 'tenant-1' })
      .mockResolvedValueOnce({ metadata: {} })
      .mockResolvedValueOnce({ metadata: {} });
    prismaMocks.user.update.mockResolvedValue({});
    prismaMocks.brandProfile.upsert.mockResolvedValue({});

    const saved = await brandDnaService.updateBrandDNA('user-1', { messaging: { elevatorPitch: '这是我确认后的介绍。' } });

    expect(saved.meta.version).toBe(4);
    expect(saved.meta.fieldProvenance?.['messaging.elevatorPitch']).toBe('user_confirmed');
  });
});
