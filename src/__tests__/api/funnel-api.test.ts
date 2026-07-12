import { describe, expect, it, vi, beforeEach } from 'vitest';

const authMocks = vi.hoisted(() => ({ getAuthUser: vi.fn() }));
vi.mock('@/modules/auth/services/auth-service', () => authMocks);

const serviceMocks = vi.hoisted(() => ({
  funnelService: { list: vi.fn(), getById: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  businessStateService: { getBusinessState: vi.fn() },
}));
vi.mock('@/modules/funnel/services/funnel-service', () => ({ funnelService: serviceMocks.funnelService }));
vi.mock('@/modules/business-state/services/BusinessStateService', () => ({ businessStateService: serviceMocks.businessStateService }));

import { GET as getFunnels, POST as postFunnel } from '@/app/api/v1/funnel/funnels/route';
import { GET as getFunnel, PATCH as patchFunnel, DELETE as deleteFunnel } from '@/app/api/v1/funnel/funnels/[id]/route';
import { GET as getHealth } from '@/app/api/v1/funnel/funnels/[id]/health/route';

const authUser = { id: 'u1', email: 't@t.com', tenantId: 't1', role: 'operator', name: 'T', preferredLanguage: 'zh', status: 'active' as const };
const makeReq = (path: string, method = 'GET', body?: any) => {
  const init: any = { method };
  if (body) { init.body = JSON.stringify(body); init.headers = { 'Content-Type': 'application/json' }; }
  return new Request(`https://example.com${path}`, init);
};

describe('Funnel API Smoke', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const okData = { items: [], meta: { total: 0, page: 1, limit: 20 } };

  it('GET /funnel/funnels → 401 without auth', async () => {
    authMocks.getAuthUser.mockResolvedValue(null);
    const res = await getFunnels(makeReq('/api/v1/funnel/funnels') as any);
    expect(res.status).toBe(401);
  });

  it('POST /funnel/funnels → 201', async () => {
    authMocks.getAuthUser.mockResolvedValue(authUser);
    serviceMocks.funnelService.create.mockResolvedValue({ id: 'f1', title: 'Test', slug: 'test-abc' });
    const res = await postFunnel(makeReq('/api/v1/funnel/funnels', 'POST', { title: 'Test' }) as any);
    expect(res.status).toBe(201);
  });

  it('GET /funnel/funnels/:id → 200', async () => {
    authMocks.getAuthUser.mockResolvedValue(authUser);
    serviceMocks.funnelService.getById.mockResolvedValue({ id: 'f1', title: 'Test' });
    const res = await getFunnel(makeReq('/api/v1/funnel/funnels/f1') as any, { params: Promise.resolve({ id: 'f1' }) } as any);
    expect(res.status).toBe(200);
  });

  it('GET /funnel/funnels/:id/health → 200', async () => {
    authMocks.getAuthUser.mockResolvedValue(authUser);
    serviceMocks.businessStateService.getBusinessState.mockResolvedValue({
      stage: 'lead_generation',
      readiness: {
        source: 'test',
        scope: 'user',
        confidence: 'derived',
        fallback: 'none',
        score: 85,
        maxScore: 100,
        percentage: 85,
      },
      bottlenecks: [],
      opportunities: [],
    });
    const res = await getHealth(makeReq('/api/v1/funnel/funnels/f1/health') as any, { params: Promise.resolve({ id: 'f1' }) } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
    expect(body.data.overall).toBe(85);
  });

  it('DELETE /funnel/funnels/:id → 200', async () => {
    authMocks.getAuthUser.mockResolvedValue(authUser);
    serviceMocks.funnelService.delete.mockResolvedValue({ deleted: true });
    const res = await deleteFunnel(makeReq('/api/v1/funnel/funnels/f1', 'DELETE') as any, { params: Promise.resolve({ id: 'f1' }) } as any);
    expect(res.status).toBe(200);
  });
});
