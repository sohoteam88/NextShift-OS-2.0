import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const routerMocks = vi.hoisted(() => ({ generate: vi.fn() }));
const quotaMocks = vi.hoisted(() => ({ enforceQuota: vi.fn() }));
const trackerMocks = vi.hoisted(() => ({ logAIUsage: vi.fn() }));
const openaiMocks = vi.hoisted(() => ({ transcribe: vi.fn(), toFile: vi.fn() }));
const supabaseMocks = vi.hoisted(() => ({
  upload: vi.fn(),
  createSignedUrl: vi.fn(),
  from: vi.fn(),
}));
const prismaMocks = vi.hoisted(() => ({
  tenant: { findUnique: vi.fn() },
  voiceProfile: { count: vi.fn(), create: vi.fn(), update: vi.fn() },
}));

vi.mock('@/modules/ai/router', () => ({ getRouterForTenant: () => routerMocks }));
vi.mock('@/modules/ai/usage/quota', () => ({ enforceQuota: quotaMocks.enforceQuota }));
vi.mock('@/modules/ai/usage/tracker', () => ({ logAIUsage: trackerMocks.logAIUsage }));
vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: async () => ({ storage: { from: supabaseMocks.from } }),
}));
vi.mock('openai', () => ({
  default: class MockOpenAI {
    audio = { transcriptions: { create: openaiMocks.transcribe } };
  },
  toFile: openaiMocks.toFile,
}));

import { voiceService } from '@/modules/voice/services/voice-service';

const originalOpenAIKey = process.env.OPENAI_API_KEY;

const extractedProfile = {
  summary: 'A practical wellness coach',
  pain_points: ['low energy'],
  health_goals: ['better habits'],
  story_angle: 'Small sustainable changes',
  content_pillars: ['daily habits'],
  background: 'Health community leader',
  motivation: 'Help families feel better',
  preferred_topics: ['wellness'],
  tone: 'warm',
  language: 'en',
  duration_secs: 42,
  source_language: 'en',
  source_file_name: 'voice.webm',
};

const initialRouting = {
  taskCategory: 'brand_extraction' as const,
  classification: {
    category: 'brand_extraction' as const,
    tier: 'A' as const,
    reason: 'Structured extraction from unstructured voice/text, needs deep understanding',
    estimatedInputTokens: 100,
    estimatedOutputTokens: 800,
  },
  selectedModel: 'claude-sonnet',
  selectedModelName: 'Claude Sonnet',
  selectedTier: 'A',
  provider: 'anthropic' as const,
  estimatedCost: 0.01,
  wasEscalated: false,
  originalTier: 'A',
};

const retryRouting = {
  ...initialRouting,
  selectedModel: 'gpt-4o',
  selectedModelName: 'GPT-4o',
  provider: 'openai' as const,
  wasEscalated: true,
};

const makeUser = () => ({
  id: 'user-1',
  email: 'steven@example.com',
  tenantId: 'tenant-1',
  role: 'member' as const,
  name: 'Steven',
  preferredLanguage: 'en',
  status: 'active' as const,
});

describe('voiceService AI router call site', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-key';
    prismaMocks.tenant.findUnique.mockResolvedValue({ settings: {} });
    prismaMocks.voiceProfile.create.mockResolvedValue({ id: 'voice-1' });
    prismaMocks.voiceProfile.update.mockResolvedValue({
      id: 'voice-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      audioUrl: 'voice/tenant-1/user-1/voice.webm',
      transcript: 'I want healthier habits',
      extractedData: extractedProfile,
      status: 'review',
      createdAt: new Date('2026-07-15T00:00:00.000Z'),
      updatedAt: new Date('2026-07-15T00:00:00.000Z'),
    });
    quotaMocks.enforceQuota.mockResolvedValue(undefined);
    trackerMocks.logAIUsage.mockResolvedValue(undefined);
    openaiMocks.toFile.mockResolvedValue({});
    openaiMocks.transcribe.mockResolvedValue({ text: 'I want healthier habits', language: 'en', duration: 42 });
    supabaseMocks.upload.mockResolvedValue({ error: null });
    supabaseMocks.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed.example/voice' }, error: null });
    supabaseMocks.from.mockReturnValue({
      upload: supabaseMocks.upload,
      createSignedUrl: supabaseMocks.createSignedUrl,
    });
  });

  afterAll(() => {
    if (originalOpenAIKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAIKey;
  });

  it('retries unparseable extraction through brand_extraction, aggregates usage, and logs retry routing', async () => {
    routerMocks.generate
      .mockResolvedValueOnce({
        text: 'not valid json',
        tokensIn: 100,
        tokensOut: 200,
        model: 'claude-sonnet',
        provider: 'anthropic',
        durationMs: 300,
        routing: initialRouting,
      })
      .mockResolvedValueOnce({
        text: JSON.stringify(extractedProfile),
        tokensIn: 40,
        tokensOut: 80,
        model: 'gpt-4o',
        provider: 'openai',
        durationMs: 120,
        routing: retryRouting,
      });

    await voiceService.upload(makeUser(), {
      file: new File([new Uint8Array([1, 2, 3])], 'voice.webm', { type: 'audio/webm' }),
      language: 'en',
      durationSecs: 42,
    });

    expect(routerMocks.generate).toHaveBeenCalledTimes(2);
    expect(routerMocks.generate.mock.calls[0][1]).toBe('brand_extraction');
    expect(routerMocks.generate.mock.calls[1][1]).toBe('brand_extraction');
    expect(quotaMocks.enforceQuota).toHaveBeenCalledWith('tenant-1');
    expect(quotaMocks.enforceQuota.mock.invocationCallOrder[0]).toBeLessThan(
      routerMocks.generate.mock.invocationCallOrder[0],
    );
    expect(trackerMocks.logAIUsage).toHaveBeenCalledWith(expect.objectContaining({
      feature: 'voice_capture',
      routing: retryRouting,
      result: expect.objectContaining({
        text: JSON.stringify(extractedProfile),
        tokensIn: 140,
        tokensOut: 280,
        durationMs: 420,
        model: 'gpt-4o',
        provider: 'openai',
      }),
    }));
  });
});
