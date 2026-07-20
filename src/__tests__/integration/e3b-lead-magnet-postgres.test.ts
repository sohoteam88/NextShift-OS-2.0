import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';
import type { LeadMagnetConfig, LeadMagnetTrack } from '@/modules/lead-magnet/types';
import { webinarService } from '@/modules/webinar-center/webinarService';
import type { WebinarPackage } from '@/modules/webinar-center/types';

const run = process.env.DATABASE_URL ? describe : describe.skip;
const db = new PrismaClient();
const tenantId = randomUUID();
const userId = randomUUID();

function config(track: LeadMagnetTrack, round: number): LeadMagnetConfig {
  const now = new Date().toISOString();
  return {
    id: `lm-${track}-${round}-${randomUUID()}`, type: 'guide', track, title: `${track} ${round}`,
    promise: 'promise', description: 'description', audiencePain: 'pain', sections: [],
    resultPage: { scoreLabel: 'A', categoryLabel: 'A', explanation: 'A', recommendations: [], nextAction: 'A', cta: { headline: 'A', buttonText: 'A', description: 'A', whatsappCta: 'A', funnelCta: 'A' } },
    cta: { headline: 'A', buttonText: 'A', description: 'A', whatsappCta: 'A', funnelCta: 'A' },
    segmentation: { leadScore: 'A', nextAction: 'A', followUpStrategy: 'A' }, qualityScore: 80,
    status: 'generated', createdAt: now, updatedAt: now,
  };
}

function webinar(round: number): WebinarPackage {
  const now = new Date().toISOString();
  return {
    id: `webinar-${round}-${randomUUID()}`,
    createdAt: now,
    updatedAt: now,
    strategy: {
      targetAudience: 'founders',
      desiredOutcome: 'growth',
      trustBuildingAngle: 'proof',
      authorityPositioning: 'expert',
      conversionObjective: 'call',
    },
    topic: {
      title: `Webinar ${round}`,
      promise: 'Original promise',
      subtitle: 'Original subtitle',
    },
    outline: {
      opening: 'opening',
      story: 'story',
      problem: 'problem',
      opportunity: 'opportunity',
      framework: 'framework',
      caseStudy: 'case study',
      offer: 'offer',
      qa: 'qa',
      cta: 'cta',
      recommendedDuration: '60m',
    },
    loomScript: 'Original script',
    slideOutline: [],
    registrationPage: {
      headline: 'Original headline',
      subheadline: 'Subheadline',
      bulletPoints: [],
      benefits: [],
      cta: 'Join',
      urgency: 'Now',
      faq: [],
    },
    replayPage: {
      headline: 'Replay',
      summary: 'Summary',
      cta: 'Watch',
      deadline: 'Friday',
    },
    followupSequence: [],
    qualityScore: 80,
    status: 'generated',
  };
}

async function queueBehindUserLock<T>(operations: () => Promise<T>[]) {
  let pending: Promise<T>[] = [];
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE
    `;
    pending = operations();
    // Both services must be queued behind this barrier before it is released.
    await new Promise((resolve) => setTimeout(resolve, 75));
  });
  return Promise.all(pending);
}

async function queueOrderedBehindUserLock<T>(
  first: () => Promise<T>,
  second: () => Promise<T>,
) {
  let firstPending!: Promise<T>;
  let secondPending!: Promise<T>;
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE
    `;
    firstPending = first();
    await new Promise((resolve) => setTimeout(resolve, 30));
    secondPending = second();
    await new Promise((resolve) => setTimeout(resolve, 75));
  });
  return Promise.all([firstPending, secondPending]);
}

run.sequential('E3B PostgreSQL Lead Magnet concurrency authority', () => {
  beforeAll(async () => {
    await db.tenant.create({ data: { id: tenantId, name: 'E3B fixture', slug: `e3b-${tenantId}` } });
    await db.user.create({ data: { id: userId, tenantId, email: `e3b-${userId}@example.test`, name: 'E3B', status: 'active', metadata: { unrelated: { locale: 'zh-MY' } } } });
  });
  afterAll(async () => { await db.tenant.deleteMany({ where: { id: tenantId } }); await db.$disconnect(); });

  it('E3-GAP-LEAD-MAGNET-04: preserves both exact track IDs and unrelated metadata across 10 concurrent rounds', async () => {
    for (let round = 0; round < 10; round += 1) {
      const retail = config('retail', round); const recruitment = config('recruitment', round);
      await Promise.all([leadMagnetService.saveTrack(userId, 'retail', retail), leadMagnetService.saveTrack(userId, 'recruitment', recruitment)]);
      const reopened = await leadMagnetService.getTracks(userId);
      expect(reopened.retail?.id).toBe(retail.id); expect(reopened.recruitment?.id).toBe(recruitment.id);
      const row = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { metadata: true } });
      expect((row.metadata as Record<string, unknown>).unrelated).toEqual({ locale: 'zh-MY' });
    }
  });

  it('E3B-PG-LEAD-SAME-ID-PATCH: merges disjoint patches and serializes same-field writes for 10 barrier rounds', async () => {
    for (let round = 0; round < 10; round += 1) {
      const retail = {
        ...config('retail', round),
        sections: [{ id: 'preserved', title: 'Untouched', body: 'Body', bullets: [] }],
      };
      await leadMagnetService.saveTrack(userId, 'retail', retail);

      await queueBehindUserLock(() => [
        leadMagnetService.updateTrack(userId, 'retail', retail.id, {
          title: `Concurrent title ${round}`,
        }),
        leadMagnetService.updateTrack(userId, 'retail', retail.id, {
          description: `Concurrent body ${round}`,
        }),
      ]);
      let reopened = (await leadMagnetService.getTracks(userId)).retail;
      expect(reopened).toMatchObject({
        id: retail.id,
        createdAt: retail.createdAt,
        title: `Concurrent title ${round}`,
        description: `Concurrent body ${round}`,
        sections: retail.sections,
      });

      await queueOrderedBehindUserLock(
        () => leadMagnetService.updateTrack(userId, 'retail', retail.id, {
          title: `First same-field value ${round}`,
        }),
        () => leadMagnetService.updateTrack(userId, 'retail', retail.id, {
          title: `Second same-field value ${round}`,
        }),
      );
      reopened = (await leadMagnetService.getTracks(userId)).retail;
      expect(reopened?.title).toBe(`Second same-field value ${round}`);
      expect(reopened?.description).toBe(`Concurrent body ${round}`);
      const row = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { metadata: true },
      });
      expect((row.metadata as Record<string, unknown>).unrelated).toEqual({
        locale: 'zh-MY',
      });
    }
  });

  it('E3B-PG-WEBINAR-SAME-ID-PATCH: merges disjoint patches and serializes same-field writes for 10 barrier rounds', async () => {
    for (let round = 0; round < 10; round += 1) {
      const existing = webinar(round);
      await webinarService.save(userId, existing);

      await queueBehindUserLock(() => [
        webinarService.update(userId, existing.id, {
          title: `Concurrent webinar title ${round}`,
        }),
        webinarService.update(userId, existing.id, {
          loomScript: `Concurrent webinar script ${round}`,
        }),
      ]);
      let reopened = await webinarService.get(userId);
      expect(reopened).toMatchObject({
        id: existing.id,
        createdAt: existing.createdAt,
        topic: {
          title: `Concurrent webinar title ${round}`,
          promise: existing.topic.promise,
          subtitle: existing.topic.subtitle,
        },
        loomScript: `Concurrent webinar script ${round}`,
        replayPage: existing.replayPage,
      });

      await queueOrderedBehindUserLock(
        () => webinarService.update(userId, existing.id, {
          registrationHeadline: `First same-field headline ${round}`,
        }),
        () => webinarService.update(userId, existing.id, {
          registrationHeadline: `Second same-field headline ${round}`,
        }),
      );
      reopened = await webinarService.get(userId);
      expect(reopened?.registrationPage.headline).toBe(
        `Second same-field headline ${round}`,
      );
      expect(reopened?.loomScript).toBe(`Concurrent webinar script ${round}`);
      const row = await db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { metadata: true },
      });
      expect((row.metadata as Record<string, unknown>).unrelated).toEqual({
        locale: 'zh-MY',
      });
    }
  });
});
