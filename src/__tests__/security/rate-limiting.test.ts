import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as postAuth } from '@/app/api/v1/auth/route';
import { POST as postContent } from '@/app/api/v1/ai/generate/content/route';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { checkRateLimit, resetRateLimits } from '@/lib/rate-limit';

const authMocks = vi.hoisted(() => ({
  getAuthUser: vi.fn(),
}));

const aiMocks = vi.hoisted(() => ({
  requireAuthApi: vi.fn(),
  generate: vi.fn(),
}));

vi.mock('@/modules/auth/services/auth-service', () => authMocks);
vi.mock('@/modules/auth/middleware/require-auth-api', () => ({
  requireAuthApi: aiMocks.requireAuthApi,
  requireRoleApi: vi.fn(),
  requireTenantApi: vi.fn(),
}));
vi.mock('@/modules/ai/services/content-service', () => ({
  contentService: { generate: aiMocks.generate },
}));

describe('Rate Limiting', () => {
  beforeEach(() => {
    resetRateLimits();
    authMocks.getAuthUser.mockReset();
    aiMocks.requireAuthApi.mockReset();
    aiMocks.generate.mockReset();
  });

  it('blocks excessive login attempts', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await postAuth(new Request('http://127.0.0.1/api/v1/auth', {
        method: 'POST',
        headers: { 'x-forwarded-for': '203.0.113.9' },
      }) as never);
      expect(response.status).toBe(200);
    }

    const blocked = await postAuth(new Request('http://127.0.0.1/api/v1/auth', {
      method: 'POST',
      headers: { 'x-forwarded-for': '203.0.113.9' },
    }) as never);

    expect(blocked.status).toBe(429);
  });

  it('blocks excessive AI generation', async () => {
    aiMocks.requireAuthApi.mockResolvedValue({
      id: 'user-1',
      email: 'member@example.com',
      tenantId: 'tenant-1',
      role: 'member',
      name: 'Member',
      preferredLanguage: 'zh',
      status: 'active',
    });
    aiMocks.generate.mockResolvedValue({ content: 'ok' });

    const request = new Request('http://127.0.0.1/api/v1/ai/generate/content', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        topic: 'testing',
        platform: 'facebook',
      }),
    });

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const response = await postContent(request.clone() as never);
      expect(response.status).toBe(200);
    }

    const blocked = await postContent(request.clone() as never);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toMatch(/^\d+$/);
    expect(blocked.headers.get('X-RateLimit-Remaining')).toBe('0');
  });

  it('blocks excessive funnel form submissions', async () => {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(await checkRateLimit('submit:203.0.113.9', 10, 60 * 60 * 1000)).toBe(true);
    }

    expect(await checkRateLimit('submit:203.0.113.9', 10, 60 * 60 * 1000)).toBe(false);
  });

  it('blocks excessive AI usage by tenant even across users', async () => {
    await sharedAiRateLimitGuard(
      { id: 'tenant-user-1', tenantId: 'tenant-shared' },
      { feature: 'tenant-test', userLimit: 10, tenantLimit: 2 },
    );
    await sharedAiRateLimitGuard(
      { id: 'tenant-user-2', tenantId: 'tenant-shared' },
      { feature: 'tenant-test', userLimit: 10, tenantLimit: 2 },
    );

    await expect(sharedAiRateLimitGuard(
      { id: 'tenant-user-3', tenantId: 'tenant-shared' },
      { feature: 'tenant-test', userLimit: 10, tenantLimit: 2 },
    )).rejects.toMatchObject({ code: 'RATE_LIMITED', statusCode: 429 });
  });

  it('keeps per-feature AI buckets isolated while retaining a total user guardrail', async () => {
    const user = { id: 'feature-user', tenantId: 'feature-tenant' };
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await sharedAiRateLimitGuard(user, { feature: 'content-engine' });
    }

    await expect(sharedAiRateLimitGuard(user, { feature: 'content-engine' }))
      .rejects.toMatchObject({ code: 'RATE_LIMITED', statusCode: 429 });
    await expect(sharedAiRateLimitGuard(user, { feature: 'lead-magnet' }))
      .resolves.toMatchObject({ remaining: 29 });
  });
});
