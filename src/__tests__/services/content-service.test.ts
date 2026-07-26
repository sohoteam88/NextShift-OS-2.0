import { beforeEach, describe, expect, it, vi } from 'vitest';

const routerMocks = vi.hoisted(() => ({ generate: vi.fn() }));
const quotaMocks = vi.hoisted(() => ({ enforceQuota: vi.fn() }));
const trackerMocks = vi.hoisted(() => ({ logAIUsage: vi.fn() }));
const prismaMocks = vi.hoisted(() => ({
  aIPromptTemplate: { findFirst: vi.fn(), findMany: vi.fn() },
  content: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
}));
const resolverMocks = vi.hoisted(() => ({ resolveVariables: vi.fn(), buildPrompt: vi.fn() }));
const validatorMocks = vi.hoisted(() => ({ validateAIOutput: vi.fn() }));

vi.mock('@/modules/ai/router', () => ({ getRouterForTenant: () => routerMocks }));
vi.mock('@/modules/ai/usage/quota', () => ({ enforceQuota: quotaMocks.enforceQuota }));
vi.mock('@/modules/ai/usage/tracker', () => ({ logAIUsage: trackerMocks.logAIUsage }));
vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/ai/prompt/resolver', () => resolverMocks);
vi.mock('@/modules/ai/prompt/validator', () => validatorMocks);

import { contentService } from '@/modules/ai/services/content-service';

const makeUser = () => ({ id: 'u1', email: 't@t.com', tenantId: 't1', role: 'operator', name: 'T', preferredLanguage: 'zh', status: 'active' as const });
const makeMember = () => ({ ...makeUser(), role: 'member' as const });
const contentRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'content-1',
  title: 'Saved title',
  body: 'Saved body',
  platform: 'facebook',
  type: 'text_post',
  status: 'draft',
  createdAt: new Date('2026-07-15T00:00:00.000Z'),
  updatedAt: new Date('2026-07-15T01:00:00.000Z'),
  ...overrides,
});

describe('contentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quotaMocks.enforceQuota.mockResolvedValue(undefined);
    routerMocks.generate.mockResolvedValue({ text: 'Generated post', tokensIn: 100, tokensOut: 200, model: 'gpt-4o', provider: 'openai', durationMs: 500 });
    resolverMocks.resolveVariables.mockResolvedValue({});
    resolverMocks.buildPrompt.mockReturnValue('Built prompt');
    validatorMocks.validateAIOutput.mockReturnValue({ valid: true, violations: [] });
    prismaMocks.aIPromptTemplate.findFirst.mockResolvedValue({ id: 't1', systemPrompt: 'sys', userPromptTemplate: 'Write about {topic}' });
    prismaMocks.aIPromptTemplate.findMany.mockResolvedValue([{ id: 'default', systemPrompt: 'sys', userPromptTemplate: 'Write about {topic}', language: 'zh', isDefault: true, category: 'content' }]);
    trackerMocks.logAIUsage.mockResolvedValue(undefined);
  });

  // ── Happy path ──
  describe('generate', () => {
    it('generates content through full pipeline', async () => {
      const result = await contentService.generate(makeUser(), { topic: 'AI trends', platform: 'facebook', language: 'zh' });
      expect(quotaMocks.enforceQuota).toHaveBeenCalled();
      expect(routerMocks.generate).toHaveBeenCalled();
      expect(validatorMocks.validateAIOutput).toHaveBeenCalled();
      expect(trackerMocks.logAIUsage).toHaveBeenCalled();
      expect(result.content).toBe('Generated post');
    });

    it('resolves template by ID when provided', async () => {
      await contentService.generate(makeUser(), { templateId: 't1', topic: 'Test', platform: 'instagram' });
      expect(prismaMocks.aIPromptTemplate.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 't1' }) }));
    });

    it('retries on validation failure', async () => {
      validatorMocks.validateAIOutput.mockReturnValueOnce({ valid: false, violations: ['blocked'] }).mockReturnValueOnce({ valid: true, violations: [] });
      const result = await contentService.generate(makeUser(), { topic: 'Test', platform: 'facebook' });
      expect(routerMocks.generate).toHaveBeenCalledTimes(2);
      expect(result.content).toBe('Generated post');
    });
  });

  // ── Quota ──
  it('throws when quota exceeded', async () => {
    quotaMocks.enforceQuota.mockRejectedValue(new Error('QUOTA_EXCEEDED'));
    await expect(contentService.generate(makeUser(), { topic: 'Test', platform: 'facebook' }))
      .rejects.toThrow('QUOTA_EXCEEDED');
  });

  it('does not update a guessed content ID outside the authenticated member ownership scope', async () => {
    prismaMocks.content.findFirst.mockResolvedValue(null);

    await expect(
      contentService.update(makeMember(), 'another-tenant-content', {
        content: 'Attempted cross-tenant update',
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });

    expect(prismaMocks.content.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: 'another-tenant-content',
        tenantId: 't1',
        ownerId: 'u1',
      },
    }));
    expect(prismaMocks.content.update).not.toHaveBeenCalled();
  });

  it.each([
    ['read', () => contentService.getById(makeMember(), 'another-tenant-content')],
    ['delete', () => contentService.delete(makeMember(), 'another-tenant-content')],
  ])('denies a cross-tenant/owner %s non-disclosingly', async (_operation, run) => {
    prismaMocks.content.findFirst.mockResolvedValue(null);

    await expect(run()).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });

    expect(prismaMocks.content.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: 'another-tenant-content',
        tenantId: 't1',
        ownerId: 'u1',
      },
    }));
    expect(prismaMocks.content.delete).not.toHaveBeenCalled();
  });

  it('lists member content with ownership, filters, bounded pagination, and deterministic ordering', async () => {
    prismaMocks.content.findMany.mockResolvedValue([contentRow()]);
    prismaMocks.content.count.mockResolvedValue(1);

    const result = await contentService.listSavedContent(makeMember(), {
      page: 2,
      limit: 10,
      status: 'draft',
      platform: 'facebook',
    });

    expect(prismaMocks.content.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        tenantId: 't1',
        ownerId: 'u1',
        status: 'draft',
        platform: 'facebook',
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      skip: 10,
      take: 10,
    }));
    expect(result.meta).toEqual({ page: 2, limit: 10, total: 1, totalPages: 1 });
    expect(result.items[0]).toEqual(expect.objectContaining({
      id: 'content-1',
      displayTitle: 'Saved title',
      preview: 'Saved body',
      updatedAt: '2026-07-15T01:00:00.000Z',
    }));
    expect(result.items[0]).not.toHaveProperty('body');
    expect(result.items[0]).not.toHaveProperty('tenantId');
    expect(result.items[0]).not.toHaveProperty('ownerId');
    expect(result.items[0]).not.toHaveProperty('promptUsed');
  });

  it('marks only duplicate drafts from the same owner and excludes published content', async () => {
    const draftA = contentRow({ id: 'draft-a', ownerId: 'u1' });
    const draftB = contentRow({
      id: 'draft-b',
      ownerId: 'u1',
      title: '  Saved title ',
      body: 'Saved   body',
    });
    const published = contentRow({ id: 'published-a', ownerId: 'u1', status: 'published' });
    prismaMocks.content.findMany
      .mockResolvedValueOnce([draftA, published])
      .mockResolvedValueOnce([draftA, draftB]);
    prismaMocks.content.count.mockResolvedValue(2);

    const result = await contentService.listSavedContent(makeMember(), { page: 1, limit: 10 });

    expect(result.items).toEqual([
      expect.objectContaining({ id: 'draft-a', isDuplicate: true, contentHash: expect.any(String) }),
      expect.objectContaining({ id: 'published-a', isDuplicate: false }),
    ]);
  });

  it.each(['operator', 'platform_admin'])('lists %s content within the current tenant only', async (role) => {
    prismaMocks.content.findMany.mockResolvedValue([]);
    prismaMocks.content.count.mockResolvedValue(0);

    await contentService.listSavedContent({ ...makeUser(), role }, { page: 1, limit: 50 });

    expect(prismaMocks.content.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 't1' },
    }));
  });

  it('returns a safe full item DTO without ownership or prompt audit fields', async () => {
    prismaMocks.content.findFirst.mockResolvedValue(contentRow());

    const item = await contentService.getById(makeMember(), 'content-1');

    expect(prismaMocks.content.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'content-1', tenantId: 't1', ownerId: 'u1' },
    }));
    expect(item).toEqual({
      id: 'content-1',
      title: 'Saved title',
      body: 'Saved body',
      platform: 'facebook',
      type: 'text_post',
      status: 'draft',
      createdAt: '2026-07-15T00:00:00.000Z',
      updatedAt: '2026-07-15T01:00:00.000Z',
    });
    expect(item).not.toHaveProperty('tenantId');
    expect(item).not.toHaveProperty('ownerId');
    expect(item).not.toHaveProperty('promptUsed');
  });

  it('updates and deletes only an already scoped canonical ID', async () => {
    prismaMocks.content.findFirst.mockResolvedValue(contentRow());
    prismaMocks.content.update.mockResolvedValue(contentRow({
      body: 'Edited body',
      updatedAt: new Date('2026-07-15T02:00:00.000Z'),
    }));

    const updated = await contentService.update(makeMember(), 'content-1', {
      title: 'Saved title',
      content: 'Edited body',
    });
    const deleted = await contentService.delete(makeMember(), 'content-1');

    expect(prismaMocks.content.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'content-1' },
      data: { title: 'Saved title', body: 'Edited body' },
    }));
    expect(updated).toEqual(expect.objectContaining({
      id: 'content-1',
      body: 'Edited body',
      updatedAt: '2026-07-15T02:00:00.000Z',
    }));
    expect(prismaMocks.content.delete).toHaveBeenCalledWith({ where: { id: 'content-1' } });
    expect(deleted).toEqual({ id: 'content-1', deleted: true });
  });
});
