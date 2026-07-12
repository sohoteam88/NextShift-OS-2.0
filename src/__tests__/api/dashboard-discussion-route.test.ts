import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '@/lib/errors';

const authMocks = vi.hoisted(() => ({
  requireAuthApi: vi.fn(),
}));

const discussionMocks = vi.hoisted(() => ({
  DISCUSSION_TURNS_LIMIT: 5,
  discussCommandCenterRecommendation: vi.fn(),
  isAiDiscussionEnabled: vi.fn(),
}));

vi.mock('@/modules/auth/middleware/require-auth-api', () => authMocks);
vi.mock('@/modules/dashboard/services/discussion-service', () => discussionMocks);

import { GET, POST } from '@/app/api/v1/dashboard/recommendation/discuss/route';

describe('dashboard recommendation discussion API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAuthApi.mockResolvedValue({
      id: 'user_1',
      tenantId: 'tenant_1',
      email: 'user@example.com',
      role: 'member',
      status: 'active',
    });
    discussionMocks.discussCommandCenterRecommendation.mockResolvedValue({
      reply: 'Focus on the qualified lead first.',
      turnsUsed: 1,
      turnsLimit: 5,
    });
    discussionMocks.isAiDiscussionEnabled.mockReturnValue(true);
  });

  it('returns discussion availability when the discussion flag is ON', async () => {
    const response = await GET(request(undefined, 'GET') as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: { turnsLimit: 5 } });
    expect(authMocks.requireAuthApi).toHaveBeenCalled();
  });

  it('returns data null from the availability probe when the discussion flag is OFF', async () => {
    discussionMocks.isAiDiscussionEnabled.mockReturnValue(false);

    const response = await GET(request(undefined, 'GET') as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: null });
  });

  it('returns the discussion response contract', async () => {
    const response = await POST(request({
      message: 'Why this recommendation?',
      history: [],
    }) as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      reply: 'Focus on the qualified lead first.',
      turnsUsed: 1,
      turnsLimit: 5,
    });
    expect(discussionMocks.discussCommandCenterRecommendation).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user_1', tenantId: 'tenant_1' }),
      { message: 'Why this recommendation?', history: [] },
    );
  });

  it('returns data null when the discussion flag is OFF', async () => {
    discussionMocks.discussCommandCenterRecommendation.mockResolvedValue(null);

    const response = await POST(request({
      message: 'Why this recommendation?',
      history: [],
    }) as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ data: null });
  });

  it('passes quota 429 responses through the API handler', async () => {
    discussionMocks.discussCommandCenterRecommendation.mockRejectedValue(
      new AppError('QUOTA_EXCEEDED', 429, 'AI daily tenant quota exceeded.'),
    );

    const response = await POST(request({
      message: 'Why this recommendation?',
      history: [],
    }) as any);
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error).toMatchObject({
      code: 'QUOTA_EXCEEDED',
    });
  });
});

function request(body?: Record<string, unknown>, method = 'POST') {
  return new Request('https://example.com/api/v1/dashboard/recommendation/discuss', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });
}
