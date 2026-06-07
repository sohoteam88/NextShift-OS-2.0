import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import { cleanupTestTenants, createTestTenants, makeNextRequest, type IsolationFixture } from './setup';
import { POST as ADD_NOTE } from '@/app/api/v1/crm/leads/[id]/notes/route';
import { analyticsService } from '@/modules/analytics/services/analytics-service';
import { logActivity } from '@/modules/crm/services/activity-service';

const authMocks = vi.hoisted(() => ({
  requireAuthApi: vi.fn(),
}));

vi.mock('@/modules/auth/middleware/require-auth-api', () => authMocks);

const run = process.env.TEST_DATABASE_URL ? describe : describe.skip;

run('Note & Activity Isolation', () => {
  let fixture: IsolationFixture;

  beforeAll(async () => {
    fixture = await createTestTenants();
  });

  afterAll(async () => {
    if (fixture) {
      await cleanupTestTenants(fixture);
    }
  });

  it('member_a cannot add note to Tenant B lead', async () => {
    authMocks.requireAuthApi.mockResolvedValue(fixture.users.memberA);
    const response = await ADD_NOTE(
      makeNextRequest('http://localhost/api/v1/crm/leads/example/notes', {
        content: 'should fail',
      }),
      { params: Promise.resolve({ id: fixture.leads.tenantB[0].id }) },
    );

    expect(response.status).toBe(404);
  });

  it('activities from Tenant B not visible to Tenant A users', async () => {
    await logActivity({
      tenantId: fixture.tenantB.id,
      leadId: fixture.leads.tenantB[0].id,
      userId: fixture.dbUsers.memberB.id,
      type: 'lead_viewed',
      description: 'Tenant B activity',
    });

    const dashboard = await analyticsService.getOperatorAnalytics(fixture.users.operatorA, '30d');
    expect(dashboard.memberStats.some((stat) => stat.id === fixture.dbUsers.memberB.id)).toBe(false);
    expect(dashboard.summary.totalUsers).toBe(3);
  });
});
