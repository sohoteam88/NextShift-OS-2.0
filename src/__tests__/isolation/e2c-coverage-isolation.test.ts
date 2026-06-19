import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { leadService } from '@/modules/crm/services/lead-service';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import { assembleRuntimeState } from '@/modules/agent-runtime/adapters/RuntimeStateAssembler';
import { assembleGrowthLoopState } from '@/modules/growth-loop/adapters/GrowthLoopAssembler';
import { cooPlanService } from '@/modules/ai-coo/services/COOPlanService';
import { cleanupTestTenants, createTestTenants, type IsolationFixture } from './setup';

const run = process.env.TEST_DATABASE_URL ? describe : describe.skip;

run('E2C Coverage Isolation', () => {
  let fixture: IsolationFixture;

  beforeAll(async () => {
    fixture = await createTestTenants();

    await prisma.content.createMany({
      data: [
        {
          tenantId: fixture.tenantA.id,
          ownerId: fixture.dbUsers.memberA.id,
          type: 'text_post',
          platform: 'facebook',
          title: `Tenant A Content ${fixture.suffix}`,
          body: `Tenant A body ${fixture.suffix}`,
          status: 'draft',
        },
        {
          tenantId: fixture.tenantB.id,
          ownerId: fixture.dbUsers.memberB.id,
          type: 'text_post',
          platform: 'facebook',
          title: `Tenant B Content ${fixture.suffix}`,
          body: `Tenant B body ${fixture.suffix}`,
          status: 'draft',
        },
      ],
    });

    await prisma.brandProfile.createMany({
      data: [
        {
          tenantId: fixture.tenantA.id,
          userId: fixture.dbUsers.memberA.id,
          brandName: `Tenant A Brand ${fixture.suffix}`,
          personalName: 'Member A',
          brandPositioning: 'Tenant A positioning',
          targetAudience: 'Tenant A audience',
          contentPillars: [{ name: 'Tenant A Pillar', emoji: 'A', pct: 100 }] as unknown as Prisma.InputJsonValue[],
        },
        {
          tenantId: fixture.tenantB.id,
          userId: fixture.dbUsers.memberB.id,
          brandName: `Tenant B Brand ${fixture.suffix}`,
          personalName: 'Member B',
          brandPositioning: 'Tenant B positioning',
          targetAudience: 'Tenant B audience',
          contentPillars: [{ name: 'Tenant B Pillar', emoji: 'B', pct: 100 }] as unknown as Prisma.InputJsonValue[],
        },
      ],
    });
  });

  afterAll(async () => {
    if (fixture) {
      await cleanupTestTenants(fixture);
    }
  });

  it('Tenant A export query cannot include Tenant B leads', async () => {
    const exportRows = await leadService.list(fixture.users.operatorA, {
      page: 1,
      limit: 100,
      sort_by: 'createdAt',
      sort_order: 'desc',
    });

    expect(exportRows.items.every((lead) => lead.tenantId === fixture.tenantA.id)).toBe(true);
    expect(exportRows.items.some((lead) => fixture.leads.tenantB.some((tenantLead) => tenantLead.id === lead.id))).toBe(false);
  });

  it('Tenant A cannot read Tenant B content through tenant-scoped content reads', async () => {
    const tenantAContent = await prisma.content.findMany({
      where: { tenantId: fixture.tenantA.id },
      select: { tenantId: true, title: true },
    });

    expect(tenantAContent.length).toBeGreaterThan(0);
    expect(tenantAContent.every((content) => content.tenantId === fixture.tenantA.id)).toBe(true);
    expect(tenantAContent.some((content) => content.title?.includes('Tenant B Content'))).toBe(false);
  });

  it('Tenant A cannot read Tenant B brand profiles through tenant-scoped profile reads', async () => {
    const tenantABrandProfiles = await prisma.brandProfile.findMany({
      where: { tenantId: fixture.tenantA.id },
      select: { tenantId: true, brandName: true },
    });

    expect(tenantABrandProfiles.length).toBeGreaterThan(0);
    expect(tenantABrandProfiles.every((profile) => profile.tenantId === fixture.tenantA.id)).toBe(true);
    expect(tenantABrandProfiles.some((profile) => profile.brandName.includes('Tenant B Brand'))).toBe(false);
  });

  it('AI context providers resolve Tenant A user context without Tenant B brand context', async () => {
    const context = await getBrandContext(fixture.dbUsers.memberA.id);

    expect(context?.brandName).toContain('Tenant A Brand');
    expect(context?.brandName).not.toContain('Tenant B Brand');
    expect(context?.positioning).toBe('Tenant A positioning');
  });

  it('AI COO, Runtime, and Growth Loop state remain scoped to Tenant A user context', async () => {
    const [cooPlan, runtimeState, growthLoopState] = await Promise.all([
      cooPlanService.getCOOPlan(fixture.dbUsers.memberA.id),
      assembleRuntimeState(fixture.dbUsers.memberA.id),
      assembleGrowthLoopState(fixture.dbUsers.memberA.id),
    ]);

    expect(cooPlan.subjectId).toBe(fixture.dbUsers.memberA.id);
    expect(runtimeState.userId).toBe(fixture.dbUsers.memberA.id);
    expect(runtimeState.tenantId).toBe(fixture.tenantA.id);
    expect(growthLoopState.subjectId).toBe(fixture.dbUsers.memberA.id);
    expect(growthLoopState.tenantId).toBe(fixture.tenantA.id);
    expect(runtimeState.tenantId).not.toBe(fixture.tenantB.id);
    expect(growthLoopState.tenantId).not.toBe(fixture.tenantB.id);
  });
});
