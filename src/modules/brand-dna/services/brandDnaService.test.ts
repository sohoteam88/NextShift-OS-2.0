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
});
