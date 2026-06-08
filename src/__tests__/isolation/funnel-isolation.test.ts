import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import prisma from '@/lib/prisma';
import { POST as SUBMIT_FUNNEL } from '@/app/api/v1/public/funnel/[slug]/submit/route';
import { cleanupTestTenants, createTestTenants, makeNextRequest, type IsolationFixture } from './setup';
import { funnelService } from '@/modules/funnel/services/funnel-service';

const run = process.env.TEST_DATABASE_URL ? describe : describe.skip;

run('Funnel Isolation', () => {
  let fixture: IsolationFixture;

  beforeAll(async () => {
    fixture = await createTestTenants();
  });

  afterAll(async () => {
    if (fixture) {
      await cleanupTestTenants(fixture);
    }
  });

  it('member_a cannot list Tenant B funnels', async () => {
    const funnels = await funnelService.list(fixture.users.memberA, {
      page: 1,
      limit: 20,
      sort_by: 'createdAt',
      sort_order: 'desc',
    });

    expect(funnels.items.every((funnel) => funnel.tenantId === fixture.tenantA.id)).toBe(true);
    expect(funnels.items.some((funnel) => funnel.id === fixture.funnels.tenantB[0].id)).toBe(false);
  });

  it('member_a cannot edit a Tenant B funnel', async () => {
    await expect(funnelService.update(fixture.users.memberA, fixture.funnels.tenantB[0].id, { title: 'Blocked' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('member_a cannot delete a Tenant B funnel', async () => {
    await expect(funnelService.delete(fixture.users.memberA, fixture.funnels.tenantB[0].id)).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('public funnel submission creates lead in correct tenant', async () => {
    const funnel = fixture.funnels.tenantB[0];
    const beforeCount = await prisma.lead.count({ where: { tenantId: fixture.tenantB.id } });

    const response = await SUBMIT_FUNNEL(
      makeNextRequest(`http://127.0.0.1/api/v1/public/funnel/${funnel.slug}/submit`, {
        name: 'Public Lead',
        phone: '+60111222333',
        email: 'public@example.test',
        source_funnel_id: funnel.id,
      }),
      { params: Promise.resolve({ slug: funnel.slug }) },
    );

    expect(response.status).toBe(201);

    const afterCount = await prisma.lead.count({ where: { tenantId: fixture.tenantB.id } });
    expect(afterCount).toBe(beforeCount + 1);

    const createdLead = await prisma.lead.findFirst({
      where: { tenantId: fixture.tenantB.id, name: 'Public Lead' },
      orderBy: { createdAt: 'desc' },
    });
    expect(createdLead?.tenantId).toBe(fixture.tenantB.id);
  });
});
