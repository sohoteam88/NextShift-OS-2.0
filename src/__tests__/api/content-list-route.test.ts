import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const authMocks = vi.hoisted(() => ({ requireAuthApi: vi.fn() }));
const contentMocks = vi.hoisted(() => ({ listSavedContent: vi.fn() }));

vi.mock('@/modules/auth/middleware/require-auth-api', () => authMocks);
vi.mock('@/modules/ai/services/content-service', () => ({
  contentService: { listSavedContent: contentMocks.listSavedContent },
}));

import { GET } from '@/app/api/v1/ai/content/route';

const user = {
  id: 'user-1',
  tenantId: 'tenant-1',
  email: 'user@example.test',
  role: 'member',
  status: 'active',
};

describe('content library list API query boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMocks.requireAuthApi.mockResolvedValue(user);
    contentMocks.listSavedContent.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
  });

  it('uses strict defaults and forwards allowlisted filters', async () => {
    const response = await GET(request('?status=draft&platform=xiaohongshu') as never);

    expect(response.status).toBe(200);
    expect(contentMocks.listSavedContent).toHaveBeenCalledWith(user, {
      page: 1,
      limit: 10,
      status: 'draft',
      platform: 'xiaohongshu',
    });
    await expect(response.json()).resolves.toEqual({
      data: [],
      meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
  });

  it.each([
    '?page=0',
    '?page=1.5',
    '?page=NaN',
    '?limit=0',
    '?limit=51',
    '?status=archived',
    '?platform=unknown',
    '?unexpected=value',
    '?page=1&page=2',
  ])('rejects invalid query %s without calling the service', async (query) => {
    const response = await GET(request(query) as never);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(contentMocks.listSavedContent).not.toHaveBeenCalled();
  });
});

function request(query = '') {
  return new NextRequest(`https://example.test/api/v1/ai/content${query}`);
}
