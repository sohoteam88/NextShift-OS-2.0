import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  getAuthUser: vi.fn(),
}));

vi.mock('@/modules/auth/services/auth-service', () => authMocks);

import { GET as getAuthMe } from '@/app/api/v1/auth/me/route';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { resolveAuthRedirect } from '@/modules/auth/services/auth-routing';

describe('Authentication Security', () => {
  beforeEach(() => {
    authMocks.getAuthUser.mockReset();
  });

  it('rejects requests without auth token', async () => {
    authMocks.getAuthUser.mockResolvedValue(null);

    await expect(requireAuthApi({} as never)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });

  it('rejects expired tokens', async () => {
    authMocks.getAuthUser.mockResolvedValue(null);

    const response = await getAuthMe(new Request('https://example.com/api/v1/auth/me') as never);
    expect(response.status).toBe(401);
  });

  it('rejects requests from suspended users', async () => {
    authMocks.getAuthUser.mockResolvedValue({
      id: 'user-1',
      email: 'suspended@example.com',
      tenantId: 'tenant-1',
      role: 'member',
      name: 'Suspended',
      preferredLanguage: 'zh',
      status: 'suspended',
    });

    await expect(requireAuthApi({} as never)).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      statusCode: 401,
    });
  });

  it('rejects requests from pending users for non-onboarding routes', () => {
    expect(
      resolveAuthRedirect({
        id: 'user-2',
        email: 'pending@example.com',
        tenantId: 'tenant-1',
        role: 'member',
        name: 'Pending',
        preferredLanguage: 'zh',
        status: 'pending',
      }),
    ).toBe('/pending');
  });
});
