import { describe, expect, it, vi, beforeEach } from 'vitest';

const authMocks = vi.hoisted(() => ({ getAuthUser: vi.fn() }));
vi.mock('@/modules/auth/services/auth-service', () => authMocks);

import { GET as getSettings } from '@/app/api/v1/admin/settings/route';
import { GET as getUsers } from '@/app/api/v1/admin/users/route';
import { GET as getDashboard } from '@/app/api/v1/team/dashboard/route';

const authUser = { id: 'u1', email: 't@t.com', tenantId: 't1', role: 'operator', name: 'T', preferredLanguage: 'zh', status: 'active' as const };
const makeReq = (path: string) => new Request(`https://example.com${path}`);

describe('Admin API Smoke', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('GET /admin/settings → 401 without auth', async () => {
    authMocks.getAuthUser.mockResolvedValue(null);
    const res = await getSettings(makeReq('/api/v1/admin/settings') as any);
    expect(res.status).toBe(401);
  });

  it('GET /admin/users → 401 without auth', async () => {
    authMocks.getAuthUser.mockResolvedValue(null);
    const res = await getUsers(makeReq('/api/v1/admin/users') as any);
    expect(res.status).toBe(401);
  });

  it('GET /team/dashboard → 401 without auth', async () => {
    authMocks.getAuthUser.mockResolvedValue(null);
    const res = await getDashboard(makeReq('/api/v1/team/dashboard') as any);
    expect(res.status).toBe(401);
  });

  it('GET /admin/settings → 403 for non-admin', async () => {
    authMocks.getAuthUser.mockResolvedValue({ ...authUser, role: 'member' });
    const res = await getSettings(makeReq('/api/v1/admin/settings') as any);
    expect(res.status).toBe(403);
  });
});
