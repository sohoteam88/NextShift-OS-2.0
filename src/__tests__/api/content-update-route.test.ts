import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CONTENT_PLATFORMS,
  CONTENT_UPDATE_LIMITS,
} from '@/modules/content-engine/types';

const authMocks = vi.hoisted(() => ({
  requireAuthApi: vi.fn(),
}));

const contentMocks = vi.hoisted(() => ({
  update: vi.fn(),
}));

const missionMocks = vi.hoisted(() => ({
  notifyMissionProgress: vi.fn(),
}));

vi.mock('@/modules/auth/middleware/require-auth-api', () => authMocks);
vi.mock('@/modules/ai/services/content-service', () => ({
  contentService: { update: contentMocks.update },
}));
vi.mock('@/modules/mission/utils/complete-mission', () => missionMocks);

import { PATCH } from '@/app/api/v1/ai/content/[id]/route';

const authenticatedUser = {
  id: 'user_1',
  tenantId: 'tenant_1',
  email: 'user@example.test',
  role: 'member',
  status: 'active',
};

describe('content update API input boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAuthApi.mockResolvedValue(authenticatedUser);
    contentMocks.update.mockResolvedValue({
      id: 'content_1',
      title: 'Saved title',
      body: 'Saved body',
      platform: 'facebook',
      status: 'draft',
    });
  });

  it('accepts title and body values exactly at the documented limits', async () => {
    const title = 't'.repeat(CONTENT_UPDATE_LIMITS.title);
    const content = 'b'.repeat(CONTENT_UPDATE_LIMITS.body);

    const response = await patchRequest({
      title,
      content,
      platform: 'facebook',
      status: 'draft',
    });

    expect(response.status).toBe(200);
    expect(contentMocks.update).toHaveBeenCalledWith(authenticatedUser, 'content_1', {
      title,
      content,
      platform: 'facebook',
      status: 'draft',
    });
  });

  it.each(CONTENT_PLATFORMS)('accepts the supported %s platform', async (platform) => {
    const response = await patchRequest({ content: 'Saved body', platform });

    expect(response.status).toBe(200);
    expect(contentMocks.update).toHaveBeenCalledWith(authenticatedUser, 'content_1', {
      content: 'Saved body',
      platform,
    });
  });

  it.each([
    ['title', { title: 't'.repeat(CONTENT_UPDATE_LIMITS.title + 1) }],
    ['body', { content: 'b'.repeat(CONTENT_UPDATE_LIMITS.body + 1) }],
  ])('rejects an overlong %s', async (_field, input) => {
    const response = await patchRequest(input);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(contentMocks.update).not.toHaveBeenCalled();
  });

  it('rejects a platform outside the supported enum', async () => {
    const response = await patchRequest({ content: 'Saved body', platform: 'unknown-network' });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(contentMocks.update).not.toHaveBeenCalled();
  });

  it.each(['tenantId', 'ownerId', 'generatedByAi', 'promptUsed'])(
    'rejects immutable field %s instead of forwarding it to the service',
    async (field) => {
      const response = await patchRequest({
        content: 'Saved body',
        [field]: field === 'generatedByAi' ? false : 'attacker-controlled',
      });
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(contentMocks.update).not.toHaveBeenCalled();
    },
  );
});

async function patchRequest(body: Record<string, unknown>) {
  return PATCH(
    new Request('https://example.test/api/v1/ai/content/content_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }) as never,
    { params: { id: 'content_1' } },
  );
}
