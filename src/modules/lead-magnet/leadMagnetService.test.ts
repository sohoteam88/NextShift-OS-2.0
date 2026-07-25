import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({ $transaction: vi.fn(), $queryRaw: vi.fn() }));
const brandMocks = vi.hoisted(() => ({ getBrandContext: vi.fn(), getBrandDnaVersion: vi.fn(), buildBrandContextPrompt: vi.fn() }));
const generationMocks = vi.hoisted(() => ({ runGeneration: vi.fn() }));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/brand-dna/services/BrandContextProvider', () => brandMocks);
vi.mock('@/modules/ai/generation', async () => ({ ...(await vi.importActual<typeof import('@/modules/ai/generation')>('@/modules/ai/generation')), runGeneration: generationMocks.runGeneration }));

import { leadMagnetService } from './leadMagnetService';
import { GENERATION_DEGRADE_LABEL } from '@/modules/ai/generation';

const brand = {
  brandName: 'NextShift', personalName: 'Lin', positioning: '行动教练', audience: '希望建立行动节奏的新手', audiencePainPoints: ['不知道如何开始'],
  messaging: { coreMessage: '从小行动开始', uniqueAngle: '清晰步骤', elevatorPitch: '整理下一步' }, offer: { primary: '行动资源', transformation: '从混乱到清晰' },
} as never;

describe('leadMagnetService.generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    brandMocks.getBrandContext.mockResolvedValue(brand);
    brandMocks.getBrandDnaVersion.mockResolvedValue(4);
    brandMocks.buildBrandContextPrompt.mockReturnValue('品牌上下文');
    prismaMocks.$transaction.mockImplementation(async (callback: (tx: typeof prismaMocks) => Promise<unknown>) => callback(prismaMocks));
    prismaMocks.$queryRaw.mockResolvedValue([{ id: 'user-1' }]);
    generationMocks.runGeneration.mockImplementation(async (_user, options) => ({ status: 'success', source: 'ai', value: { ...options.fallback, title: 'AI 行动启动指南', promise: '用清晰步骤整理你的下一步。', description: '用清晰步骤整理你的下一步。' }, text: 'unused', result: {} }));
  });

  it('persists a real AI result from the G0 gateway', async () => {
    const result = await leadMagnetService.generate('user-1', 'tenant-1', 'guide');
    expect(result).toMatchObject({ title: 'AI 行动启动指南', generatedByAi: true });
    expect(generationMocks.runGeneration).toHaveBeenCalledWith({ id: 'user-1', tenantId: 'tenant-1' }, expect.objectContaining({ feature: 'lead_magnet_generation', taskCategory: 'content_generation' }));
    expect(generationMocks.runGeneration.mock.calls[0][1].context.platform.platform).toBe('blog');
  });

  it('labels a gateway template fallback and never marks it as AI', async () => {
    generationMocks.runGeneration.mockImplementation(async (_user, options) => ({ status: 'degraded', source: 'template_fallback', value: options.fallback, userVisibleLabel: GENERATION_DEGRADE_LABEL, reason: 'router unavailable' }));
    const result = await leadMagnetService.generate('user-1', 'tenant-1', 'guide');
    expect(result).toMatchObject({ generatedByAi: false, degradedLabel: GENERATION_DEGRADE_LABEL });
  });

  it('retries rejected AI output twice then saves only the labelled safe fallback', async () => {
    generationMocks.runGeneration.mockImplementation(async (_user, options) => ({ status: 'success', source: 'ai', value: { ...options.fallback, title: '加入后月入RM8,000，包赚。' }, text: 'unsafe', result: {} }));
    const result = await leadMagnetService.generate('user-1', 'tenant-1', 'guide');
    expect(generationMocks.runGeneration).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({ generatedByAi: false, degradedLabel: GENERATION_DEGRADE_LABEL });
    expect(JSON.stringify(result)).not.toMatch(/月入|包赚|RM8,000/);
  });
});
