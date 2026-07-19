import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getBrandContext } from '@/modules/brand-dna/services/BrandContextProvider';
import type { WebinarPackage } from './types';
import { generateFullWebinar } from './webinarGenerators';
import { validateWebinar } from './webinarValidator';
import { createHash } from 'node:crypto';
import { AppError } from '@/lib/errors';

function withIdentity(pkg: Omit<WebinarPackage, 'id' | 'createdAt' | 'updatedAt'> | WebinarPackage, now = new Date().toISOString()): WebinarPackage {
  if ('id' in pkg && typeof pkg.id === 'string' && pkg.id && pkg.createdAt && pkg.updatedAt) return pkg;
  const id = `webinar-${createHash('sha256').update(JSON.stringify(pkg)).digest('hex').slice(0, 20)}`;
  return { ...pkg, id, createdAt: now, updatedAt: now } as WebinarPackage;
}

async function withLockedUser<T>(userId: string, mutate: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`SELECT "id" FROM "users" WHERE "id" = ${userId}::uuid FOR UPDATE`);
    if (locked.length !== 1) throw new AppError('NOT_FOUND', 404, 'User not found');
    return mutate(tx);
  });
}

export const webinarService = {
  async generate(userId: string): Promise<WebinarPackage> {
    const ctx = await getBrandContext(userId);
    if (!ctx) throw new Error('Brand DNA not found');
    const pkg = generateFullWebinar(ctx);
    pkg.qualityScore = validateWebinar(pkg).score;
    await this.save(userId, pkg);
    return pkg;
  },
  async save(userId: string, pkg: WebinarPackage) {
    const json = JSON.stringify(pkg);
    await withLockedUser(userId, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`UPDATE "users" SET "metadata" = jsonb_set(COALESCE("metadata", '{}'::jsonb), '{webinar}', ${json}::jsonb, true), "updated_at" = NOW() WHERE "id" = ${userId}::uuid RETURNING "id"`);
      if (rows.length !== 1) throw new AppError('NOT_FOUND', 404, 'User not found');
    });
    return pkg;
  },
  async get(userId: string): Promise<WebinarPackage | null> {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { metadata: true, updatedAt: true } });
    const meta = (user?.metadata as Record<string, unknown>) ?? {};
    const w = meta.webinar;
    if (!w || typeof w !== 'object') return null;
    const normalized = withIdentity(w as WebinarPackage, user?.updatedAt?.toISOString() ?? new Date(0).toISOString());
    if (!('id' in w) || !('createdAt' in w) || !('updatedAt' in w)) await this.save(userId, normalized);
    return normalized;
  },
  async update(userId: string, id: string, patch: { title?: string; promise?: string; subtitle?: string; loomScript?: string; registrationHeadline?: string; registrationCta?: string }) {
    return withLockedUser(userId, async (tx) => {
      // Compute the patch only after acquiring the user-row lock. Disjoint
      // patches merge against the latest committed package; same-field writes
      // follow explicit serialized last-committer-wins semantics.
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { metadata: true },
      });
      const metadata = (user?.metadata as Record<string, unknown>) ?? {};
      const current =
        metadata.webinar && typeof metadata.webinar === 'object'
          ? (metadata.webinar as WebinarPackage)
          : null;
      if (!current || current.id !== id) {
        throw new AppError('NOT_FOUND', 404, 'Webinar not found');
      }

      const next: WebinarPackage = {
        ...current,
        topic: {
          ...current.topic,
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.promise !== undefined ? { promise: patch.promise } : {}),
          ...(patch.subtitle !== undefined ? { subtitle: patch.subtitle } : {}),
        },
        ...(patch.loomScript !== undefined
          ? { loomScript: patch.loomScript }
          : {}),
        registrationPage: {
          ...current.registrationPage,
          ...(patch.registrationHeadline !== undefined
            ? { headline: patch.registrationHeadline }
            : {}),
          ...(patch.registrationCta !== undefined
            ? { cta: patch.registrationCta }
            : {}),
        },
        updatedAt: new Date().toISOString(),
        status: 'saved',
      };
      const json = JSON.stringify(next);
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        UPDATE "users" SET "metadata" = jsonb_set(COALESCE("metadata", '{}'::jsonb), '{webinar}', ${json}::jsonb, true), "updated_at" = NOW()
        WHERE "id" = ${userId}::uuid AND "metadata" #>> '{webinar,id}' = ${id}
        RETURNING "id"
      `);
      if (rows.length !== 1) throw new AppError('NOT_FOUND', 404, 'Webinar not found');
      return next;
    });
  },
  async delete(userId: string, id: string) {
    await withLockedUser(userId, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`UPDATE "users" SET "metadata" = COALESCE("metadata", '{}'::jsonb) - 'webinar', "updated_at" = NOW() WHERE "id" = ${userId}::uuid AND "metadata" #>> '{webinar,id}' = ${id} RETURNING "id"`);
      if (rows.length !== 1) throw new AppError('NOT_FOUND', 404, 'Webinar not found');
    });
    return { deleted: true };
  },
  async getContext(userId: string) { const pkg = await this.get(userId); if (!pkg) return null; return { title: pkg.topic.title, promise: pkg.topic.promise, audience: pkg.strategy.targetAudience, CTA: pkg.outline.cta, outline: pkg.outline, offer: pkg.outline.offer }; },
};
