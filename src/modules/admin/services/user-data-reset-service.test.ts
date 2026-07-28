import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { AppError } from '@/lib/errors';

const mutation = vi.hoisted(() => ({ loadPlatformUserTarget: vi.fn() }));
const audit = vi.hoisted(() => ({
  writePlatformAuditInTransaction: vi.fn(),
  writePlatformAuditUsing: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({ default: {} }));
vi.mock('./platform-mutation-service', () => mutation);
vi.mock('./platform-audit-service', () => audit);

import { resetUserBusinessDataWithAudit } from './user-data-reset-service';

const actorId = '10000000-0000-4000-8000-000000000001';
const targetId = '10000000-0000-4000-8000-000000000002';
const targetEmail = 'reset@example.test';
const initialCounts: Record<string, number> = {
  leadTag: 2, scheduledMessage: 3, note: 4, activity: 5, analyticsEvent: 6,
  customer: 7, lead: 8, funnel: 9, content: 10, userProgress: 1, mission: 11,
  achievement: 12, brandProfile: 1, aiUsageLog: 13, dailyAction: 14,
  trainingProgress: 15, voiceProfile: 16, brandInterview: 17, postPerformance: 18,
  contentCalendar: 19, videoProject: 20,
};

function createDatabase(options: { failTable?: string } = {}) {
  const targetCounts = { ...initialCounts };
  const sameTenantOtherCounts = Object.fromEntries(Object.entries(initialCounts).map(([table, count]) => [table, count + 100]));
  const deletions: Record<string, ReturnType<typeof vi.fn>> = {};
  const tx: {
    user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    [key: string]: unknown;
  } = {
    user: {
      findUnique: vi.fn().mockResolvedValue({ metadata: {
        brand_profile: { completed: true },
        brand_dna_field_provenance: { identity: 'user_confirmed' },
        brand_dna_track_audience: { retail: 'owners' },
        brand_dna_versions: [{ version: 2 }],
        brand_builder_state: { current_step: 3, completed_steps: ['interview', 'accounts'] },
        onboarding_note: 'keep me',
      } }),
      update: vi.fn().mockResolvedValue({}),
    },
  };

  for (const table of Object.keys(initialCounts)) {
    const deleteMany = vi.fn(async (args: { where: unknown }) => {
      if (table === options.failTable) throw new Error(`Injected ${table} failure`);
      // This fake database only removes the target's partition when its ID is
      // present in the predicate; same-tenant data has a different owner ID.
      expect(JSON.stringify(args.where)).toContain(targetId);
      const count = targetCounts[table];
      targetCounts[table] = 0;
      return { count };
    });
    deletions[table] = deleteMany;
    tx[table === 'aiUsageLog' ? 'aIUsageLog' : table] = { deleteMany };
  }

  const db = {
    $transaction: vi.fn(async (work: (transaction: typeof tx) => Promise<unknown>) => {
      const snapshot = { ...targetCounts };
      try {
        return await work(tx);
      } catch (error) {
        Object.assign(targetCounts, snapshot);
        throw error;
      }
    }),
  } as unknown as PrismaClient;

  return { db, targetCounts, sameTenantOtherCounts, deletions, tx };
}

describe('resetUserBusinessDataWithAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mutation.loadPlatformUserTarget.mockResolvedValue({
      id: targetId, tenantId: 'same-tenant', name: 'Target', email: targetEmail,
      role: 'member', status: 'active',
    });
  });

  it('clears only the target account business records and preserves unrelated metadata', async () => {
    const fixture = createDatabase();

    const receipt = await resetUserBusinessDataWithAudit(actorId, targetId, targetEmail, 'reset-success', fixture.db);

    expect(receipt.perTableCounts).toEqual(initialCounts);
    expect(fixture.targetCounts).toEqual(Object.fromEntries(Object.keys(initialCounts).map((table) => [table, 0])));
    expect(fixture.sameTenantOtherCounts).toEqual(Object.fromEntries(Object.entries(initialCounts).map(([table, count]) => [table, count + 100])));
    expect(fixture.tx.user.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: targetId },
      data: expect.objectContaining({ metadata: { onboarding_note: 'keep me' } }),
    }));
    const metadataUpdate = fixture.tx.user.update.mock.calls[0]?.[0] as { data: { metadata: Record<string, unknown> } };
    expect(metadataUpdate.data.metadata).not.toHaveProperty('brand_builder_state');
    expect(receipt.metadataKeysCleared).toEqual([
      'brand_profile', 'brand_dna_field_provenance', 'brand_dna_track_audience', 'brand_dna_versions', 'brand_builder_state',
    ]);
    expect(audit.writePlatformAuditInTransaction).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      action: 'user.data.reset',
      outcome: 'success',
      metadata: expect.objectContaining({ target_email: targetEmail, per_table_counts: initialCounts }),
    }));
  });

  it('normalizes email casing and surrounding whitespace before confirmation', async () => {
    const fixture = createDatabase();
    mutation.loadPlatformUserTarget.mockResolvedValue({
      id: targetId, tenantId: 'same-tenant', name: 'Target', email: 'Reset@Example.test',
      role: 'member', status: 'active',
    });

    const receipt = await resetUserBusinessDataWithAudit(
      actorId,
      targetId,
      ' reset@example.test ',
      'reset-normalized-email',
      fixture.db,
    );

    expect(receipt.perTableCounts).toEqual(initialCounts);
    expect(fixture.targetCounts).toEqual(Object.fromEntries(Object.keys(initialCounts).map((table) => [table, 0])));
  });

  it('rejects a mismatched email before deleting anything and records a failure audit', async () => {
    const fixture = createDatabase();

    await expect(resetUserBusinessDataWithAudit(actorId, targetId, 'other@example.test', 'reset-mismatch', fixture.db))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 400 });

    expect(Object.values(fixture.deletions).every((deleteMany) => deleteMany.mock.calls.length === 0)).toBe(true);
    expect(fixture.targetCounts).toEqual(initialCounts);
    expect(audit.writePlatformAuditUsing).toHaveBeenCalledWith(fixture.db, expect.objectContaining({
      action: 'user.data.reset', outcome: 'failure', metadata: expect.objectContaining({ failure_code: 'VALIDATION_ERROR' }),
    }));
  });

  it('rolls back every target deletion when a table delete fails and writes a failure audit', async () => {
    const fixture = createDatabase({ failTable: 'activity' });

    await expect(resetUserBusinessDataWithAudit(actorId, targetId, targetEmail, 'reset-rollback', fixture.db))
      .rejects.toThrow('Injected activity failure');

    expect(fixture.targetCounts).toEqual(initialCounts);
    expect(fixture.sameTenantOtherCounts).toEqual(Object.fromEntries(Object.entries(initialCounts).map(([table, count]) => [table, count + 100])));
    expect(audit.writePlatformAuditInTransaction).not.toHaveBeenCalled();
    expect(audit.writePlatformAuditUsing).toHaveBeenCalledWith(fixture.db, expect.objectContaining({
      action: 'user.data.reset', outcome: 'failure', metadata: expect.objectContaining({ failure_code: 'Error' }),
    }));
  });

  it('preserves the original reset error when failure auditing also fails', async () => {
    const fixture = createDatabase({ failTable: 'activity' });
    audit.writePlatformAuditUsing.mockRejectedValueOnce(new Error('Audit unavailable'));

    await expect(resetUserBusinessDataWithAudit(actorId, targetId, targetEmail, 'reset-audit-failure', fixture.db))
      .rejects.toThrow('Injected activity failure');

    expect(audit.writePlatformAuditUsing).toHaveBeenCalledOnce();
  });
});
