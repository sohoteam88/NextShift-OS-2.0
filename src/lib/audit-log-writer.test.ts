import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@/lib/prisma';
import {
  resolveAuditTarget,
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

  it('downgrades an invalid production targetId into metadata.target_key and reports it', () => {
    vi.stubEnv('NODE_ENV', 'production');

    expect(resolveAuditTarget({
      targetId: 'mission-plan-lead_magnet',
      targetKey: 'unused-explicit-key',
      metadata: { missionType: 'LEAD_MAGNET' },
      context: { action: 'workforce.plan.created' },
    })).toEqual({
      targetId: null,
      targetKey: 'mission-plan-lead_magnet',
      metadata: {
        missionType: 'LEAD_MAGNET',
        target_key: 'mission-plan-lead_magnet',
      },
    });
    expect(sentryMocks.captureMessage).toHaveBeenCalledWith(
      'Invalid AuditLog.targetId was downgraded to metadata.target_key',
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
