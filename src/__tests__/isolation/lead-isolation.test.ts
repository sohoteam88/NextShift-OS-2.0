import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/v1/crm/leads/route';
import { GET as GET_LEAD, PATCH, DELETE } from '@/app/api/v1/crm/leads/[id]/route';
import { cleanupTestTenants, createTestTenants, makeNextRequest, type IsolationFixture } from './setup';

const authMocks = vi.hoisted(() => ({
  requireAuthApi: vi.fn(),
  requireRoleApi: vi.fn(),
}));

vi.mock('@/modules/auth/middleware/require-auth-api', () => authMocks);

const run = process.env.TEST_DATABASE_URL ? describe : describe.skip;

run('Lead Isolation', () => {
  let fixture: IsolationFixture;

  beforeAll(async () => {
    fixture = await createTestTenants();
  });

  afterAll(async () => {
    if (fixture) {
      await cleanupTestTenants(fixture);
    }
  });

  it('member_a cannot see leads from Tenant B', async () => {
    authMocks.requireAuthApi.mockResolvedValue(fixture.users.memberA);
    const response = await GET(makeNextRequest('http://127.0.0.1/api/v1/crm/leads?page=1&limit=50'));
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.data.every((lead: { tenantId: string }) => lead.tenantId === fixture.tenantA.id)).toBe(true);
    expect(payload.data.some((lead: { id: string }) => fixture.leads.tenantB.some((tenantLead) => tenantLead.id === lead.id))).toBe(false);
  });

  it('member_a cannot access a specific Tenant B lead by ID', async () => {
    authMocks.requireAuthApi.mockResolvedValue(fixture.users.memberA);
    const response = await GET_LEAD(
      makeNextRequest('http://127.0.0.1/api/v1/crm/leads/example'),
      { params: Promise.resolve({ id: fixture.leads.tenantB[0].id }) },
    );

    expect(response.status).toBe(404);
  });

  it('member_a cannot create a lead in Tenant B', async () => {
    authMocks.requireAuthApi.mockResolvedValue(fixture.users.memberA);
    const response = await POST(
      makeNextRequest('http://127.0.0.1/api/v1/crm/leads', {
        name: 'Manipulated Lead',
        email: 'manipulated@example.test',
        phone: '+60123456789',
        source: 'test',
        tenant_id: fixture.tenantB.id,
      }),
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.data.tenantId).toBe(fixture.tenantA.id);
  });

  it('member_a cannot update a Tenant B lead', async () => {
    authMocks.requireAuthApi.mockResolvedValue(fixture.users.memberA);
    const response = await PATCH(
      makeNextRequest('http://127.0.0.1/api/v1/crm/leads/example', {
        name: 'Updated',
      }),
      { params: Promise.resolve({ id: fixture.leads.tenantB[0].id }) },
    );

    expect(response.status).toBe(404);
  });

  it('member_a cannot delete a Tenant B lead', async () => {
    authMocks.requireAuthApi.mockResolvedValue(fixture.users.memberA);
    const response = await DELETE(
      makeNextRequest('http://127.0.0.1/api/v1/crm/leads/example', undefined, { method: 'DELETE' }),
      { params: Promise.resolve({ id: fixture.leads.tenantB[0].id }) },
    );

    expect(response.status).toBe(404);
  });
});
