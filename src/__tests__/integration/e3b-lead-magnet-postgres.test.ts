import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';
import type { LeadMagnetConfig, LeadMagnetTrack } from '@/modules/lead-magnet/types';

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
});
