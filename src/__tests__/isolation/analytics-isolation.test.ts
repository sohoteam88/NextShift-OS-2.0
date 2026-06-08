import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { cleanupTestTenants, createTestTenants, type IsolationFixture } from './setup';
import { analyticsService } from '@/modules/analytics/services/analytics-service';

const run = process.env.TEST_DATABASE_URL ? describe : describe.skip;

run('Analytics Isolation', () => {
  let fixture: IsolationFixture;

  beforeAll(async () => {
    fixture = await createTestTenants();
  });

  afterAll(async () => {
    if (fixture) {
      await cleanupTestTenants(fixture);
    }
  });

  it('member analytics only includes own tenant data', async () => {
    const dashboard = await analyticsService.getMemberAnalytics(fixture.users.memberA, '30d');
    expect(dashboard.summary.totalUsers).toBe(1);
    expect(dashboard.memberStats).toHaveLength(1);
    expect(dashboard.memberStats[0].id).toBe(fixture.dbUsers.memberA.id);
  });

  it('operator analytics only includes own tenant data', async () => {
    const dashboard = await analyticsService.getOperatorAnalytics(fixture.users.operatorA, '30d');
    expect(dashboard.summary.totalUsers).toBe(3);
    expect(dashboard.memberStats.some((stat) => stat.id === fixture.dbUsers.operatorB.id)).toBe(false);
    expect(dashboard.memberStats.some((stat) => stat.id === fixture.dbUsers.memberB.id)).toBe(false);
  });
});
