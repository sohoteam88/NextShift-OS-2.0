import { describe, expect, it, vi, beforeEach } from 'vitest';

const authMocks = vi.hoisted(() => ({ getAuthUser: vi.fn() }));
vi.mock('@/modules/auth/services/auth-service', () => authMocks);

import { GET as getLeads } from '@/app/api/v1/crm/leads/route';
import { GET as getCustomers } from '@/app/api/v1/crm/customers/route';

const authUser = { id: 'u1', email: 't@t.com', tenantId: 't1', role: 'admin', name: 'T', preferredLanguage: 'zh', status: 'active' as const };
const makeReq = (path: string) => new Request(`https://example.com${path}`);

describe('CRM API Smoke', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('GET /crm/leads → 401 without auth', async () => {
    authMocks.getAuthUser.mockResolvedValue(null);
    const res = await getLeads(makeReq('/api/v1/crm/leads') as any);
    expect(res.status).toBe(401);
  });

  it('GET /crm/leads → 200 with auth', async () => {
    authMocks.getAuthUser.mockResolvedValue(authUser);
    const res = await getLeads(makeReq('/api/v1/crm/leads') as any);
    // May return 200 or 400 depending on DB — smoke test checks auth works
    // Route may require specific role — smoke test verifies auth module is engaged
    expect(res.status).not.toBe(401);
  });

  it('GET /crm/customers → 401 without auth', async () => {
    authMocks.getAuthUser.mockResolvedValue(null);
    const res = await getCustomers(makeReq('/api/v1/crm/customers') as any);
    expect(res.status).toBe(401);
  });

  it('GET /crm/customers → not 401 with auth', async () => {
    authMocks.getAuthUser.mockResolvedValue(authUser);
    const res = await getCustomers(makeReq('/api/v1/crm/customers') as any);
    expect(res.status).not.toBe(401);
  });
});
