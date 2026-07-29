import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@/lib/prisma';
import {
  InvalidAuditTargetIdError,
  resolveAuditTarget,
  runAuditBestEffort,
  writeAuditIfMissing,
} from './audit-log-writer';

const sentryMocks = vi.hoisted(() => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => sentryMocks);

vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('audit-log-writer target identity guard', () => {
  beforeEach(() => {
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'audit-1' } as never);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('fails fast outside production when targetId is not a UUID', () => {
    vi.stubEnv('NODE_ENV', 'test');

    expect(() => resolveAuditTarget({
      targetId: 'outcome-first_lead',
      targetKey: 'outcome-first_lead',
    })).toThrow('AuditLog.targetId must be a UUID: outcome-first_lead');
  });

  it('preserves fail-fast through runAuditBestEffort outside production', async () => {
    vi.stubEnv('NODE_ENV', 'test');

    await expect(runAuditBestEffort(
      { operation: 'test-invalid-target' },
      () => writeAuditIfMissing({
        tenantId: '00000000-0000-4000-8000-000000000001',
        actorId: '00000000-0000-4000-8000-000000000002',
        action: 'outcome.created',
        targetType: 'business_outcome',
        targetId: 'outcome-first_lead',
        targetKey: 'outcome:first_lead',
      }),
    )).rejects.toBeInstanceOf(InvalidAuditTargetIdError);
    expect(sentryMocks.captureException).not.toHaveBeenCalled();
  });

  it('keeps the caller target_key when an invalid production targetId is downgraded', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await writeAuditIfMissing({
      tenantId: '00000000-0000-4000-8000-000000000001',
      actorId: '00000000-0000-4000-8000-000000000002',
      action: 'workforce.plan.created',
      targetType: 'workforce_plan',
      targetId: 'mission-plan-lead_magnet',
      targetKey: 'workforce-plan:lead_magnet',
      metadata: { missionType: 'LEAD_MAGNET' },
    });

    expect(prisma.auditLog.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        targetId: null,
        metadata: {
          path: ['target_key'],
          equals: 'workforce-plan:lead_magnet',
        },
      }),
      select: { id: true },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetId: null,
        metadata: expect.objectContaining({
          missionType: 'LEAD_MAGNET',
          target_key: 'workforce-plan:lead_magnet',
          invalid_target_id: 'mission-plan-lead_magnet',
        }),
      }),
    });
    expect(sentryMocks.captureMessage).toHaveBeenCalledWith(
      'Invalid AuditLog.targetId was downgraded to metadata.invalid_target_id',
      expect.objectContaining({
        level: 'warning',
        extra: expect.objectContaining({
          invalidTargetId: 'mission-plan-lead_magnet',
          action: 'workforce.plan.created',
        }),
      }),
    );
  });

  it('writes null targetId and keeps the synthetic identity queryable in target_key', async () => {
    await writeAuditIfMissing({
      tenantId: '00000000-0000-4000-8000-000000000001',
      actorId: '00000000-0000-4000-8000-000000000002',
      action: 'outcome.created',
      targetType: 'business_outcome',
      targetId: null,
      targetKey: 'outcome-first_lead',
      metadata: { templateId: 'FIRST_LEAD' },
    });

    expect(prisma.auditLog.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        targetId: null,
        metadata: {
          path: ['target_key'],
          equals: 'outcome-first_lead',
        },
      }),
      select: { id: true },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        targetId: null,
        metadata: expect.objectContaining({
          target_key: 'outcome-first_lead',
          templateId: 'FIRST_LEAD',
        }),
      }),
    });
  });
});
