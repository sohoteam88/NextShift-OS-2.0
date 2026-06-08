import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { cleanupTestTenants, createTestTenants, type IsolationFixture } from './setup';
import { templateService } from '@/modules/ai/services/template-service';
import { logAIUsage, getUsageStats } from '@/modules/ai/usage/tracker';
import { checkQuota } from '@/modules/ai/usage/quota';

const run = process.env.TEST_DATABASE_URL ? describe : describe.skip;

run('AI Isolation', () => {
  let fixture: IsolationFixture;

  beforeAll(async () => {
    fixture = await createTestTenants();
  });

  afterAll(async () => {
    if (fixture) {
      await cleanupTestTenants(fixture);
    }
  });

  it('member_a cannot use Tenant B AI templates', async () => {
    await expect(templateService.getById(fixture.tenantA.id, fixture.templates.tenantB[0].id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('AI usage logged to correct tenant', async () => {
    await logAIUsage({
      tenantId: fixture.tenantA.id,
      userId: fixture.dbUsers.memberA.id,
      feature: 'content_generator',
      result: {
        provider: 'openai',
        model: 'gpt-4o',
        text: 'tenant a result',
        tokensIn: 100,
        tokensOut: 40,
        durationMs: 900,
      },
    });

    await logAIUsage({
      tenantId: fixture.tenantB.id,
      userId: fixture.dbUsers.memberB.id,
      feature: 'content_generator',
      result: {
        provider: 'openai',
        model: 'gpt-4o',
        text: 'tenant b result',
        tokensIn: 100,
        tokensOut: 40,
        durationMs: 900,
      },
    });

    const tenantAUsage = await getUsageStats(fixture.tenantA.id);
    expect(tenantAUsage.totalCalls).toBe(4);
    expect(tenantAUsage.byFeature.content_generator.calls).toBe(4);
  });

  it('member_a AI quota checked against Tenant A, not Tenant B', async () => {
    const quota = await checkQuota(fixture.tenantA.id);
    expect(quota.limit).toBe(200);
    expect(quota.used).toBe(4);
  });
});
