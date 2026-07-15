import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  brandProfile: { findUnique: vi.fn(), update: vi.fn() },
  content: { create: vi.fn(), findFirst: vi.fn(), count: vi.fn(), updateMany: vi.fn() },
  contentCalendar: { findMany: vi.fn(), deleteMany: vi.fn(), createMany: vi.fn() },
  user: { findUnique: vi.fn(), update: vi.fn() },
}));
const brandContextMocks = vi.hoisted(() => ({ getBrandContext: vi.fn() }));
const generatorMocks = vi.hoisted(() => ({
  generateContentPillars: vi.fn(),
  generateCalendar: vi.fn(),
  generatePost: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/brand-dna/services/BrandContextProvider', () => brandContextMocks);
vi.mock('./contentGenerators', () => generatorMocks);

import { contentEngineService } from './contentEngineService';

describe('contentEngineService.generatePlatformPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    brandContextMocks.getBrandContext.mockResolvedValue({
      contentPillars: [{ name: '教育内容', emoji: '📚', percentage: 100, description: 'Useful advice' }],
    });
    generatorMocks.generatePost.mockReturnValue({
      id: 'post-temporary-id',
      pillar: '教育内容',
      pillarEmoji: '📚',
      title: 'Temporary generated title',
      hook: 'Hook',
      body: 'Generated body',
      cta: 'CTA',
      hashtags: ['#test'],
      platform: 'facebook',
      format: 'text_post',
      funnelStage: 'awareness',
      status: 'generated',
      qualityScore: 75,
      createdAt: '2026-07-15T00:00:00.000Z',
      updatedAt: '2026-07-15T00:00:00.000Z',
    });
    prismaMocks.content.create.mockResolvedValue({
      id: 'content-canonical-id',
      title: 'Temporary generated title',
      body: 'Generated body',
      platform: 'facebook',
      type: 'text_post',
      status: 'draft',
      createdAt: new Date('2026-07-15T01:02:03.000Z'),
    });
  });

  it('creates exactly one canonical draft and returns its persisted identity', async () => {
    const result = await contentEngineService.generatePlatformPost(
      'owner-1',
      'tenant-1',
      'facebook',
      'text_post',
      'awareness',
    );

    expect(prismaMocks.content.create).toHaveBeenCalledTimes(1);
    expect(prismaMocks.content.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        ownerId: 'owner-1',
        status: 'draft',
        title: 'Temporary generated title',
        body: 'Generated body',
      }),
    });
    expect(result.id).toBe('content-canonical-id');
    expect(result.id).not.toBe('post-temporary-id');
    expect(result).toMatchObject({
      title: 'Temporary generated title',
      body: 'Generated body',
      platform: 'facebook',
      format: 'text_post',
      status: 'draft',
      createdAt: '2026-07-15T01:02:03.000Z',
    });
  });
});
