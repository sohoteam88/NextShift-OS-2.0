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
import { CONTENT_COMMAND_CENTER_PLATFORMS } from './types';

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
      updatedAt: new Date('2026-07-15T01:03:04.000Z'),
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

describe('contentEngineService.getLastPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('refresh-hydrates the latest E1-compatible canonical text post', async () => {
    prismaMocks.content.findFirst.mockResolvedValue({
      id: 'content-refresh-id',
      title: 'Saved title',
      body: 'Saved body',
      platform: 'instagram',
      type: 'text_post',
      status: 'draft',
      createdAt: new Date('2026-07-15T02:03:04.000Z'),
      updatedAt: new Date('2026-07-15T03:04:05.000Z'),
    });

    const result = await contentEngineService.getLastPost('owner-1');

    expect(prismaMocks.content.findFirst).toHaveBeenCalledWith({
      where: {
        ownerId: 'owner-1',
        type: 'text_post',
        platform: { in: [...CONTENT_COMMAND_CENTER_PLATFORMS] },
        status: { in: ['draft', 'generated', 'copied', 'published'] },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });
    expect(result).toMatchObject({
      id: 'content-refresh-id',
      title: 'Saved title',
      body: 'Saved body',
      platform: 'instagram',
      format: 'text_post',
      status: 'draft',
      createdAt: '2026-07-15T02:03:04.000Z',
      updatedAt: '2026-07-15T03:04:05.000Z',
    });
  });

  it.each([
    ['legacy post type', { type: 'post', platform: 'facebook' }],
    ['WhatsApp record', { type: 'text_post', platform: 'whatsapp' }],
    ['legacy Xiaohongshu alias', { type: 'text_post', platform: 'xiaohongshu' }],
    ['missing platform', { type: 'text_post', platform: null }],
    ['unknown status', { type: 'text_post', platform: 'facebook', status: 'archived' }],
  ])('does not expose an incompatible %s to the E1 editor', async (_case, incompatible) => {
    prismaMocks.content.findFirst.mockResolvedValue({
      id: 'content-incompatible-id',
      title: 'Not an E1 draft',
      body: 'Unsupported body',
      status: 'draft',
      createdAt: new Date('2026-07-15T02:03:04.000Z'),
      updatedAt: new Date('2026-07-15T03:04:05.000Z'),
      ...incompatible,
    });

    await expect(contentEngineService.getLastPost('owner-1')).resolves.toBeNull();
  });
});
