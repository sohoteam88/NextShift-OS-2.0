import * as Sentry from '@sentry/nextjs';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AuditContext = Record<string, unknown>;

type AuditTargetInput = {
  targetId?: string | null;
  targetKey: string;
  metadata?: Record<string, unknown>;
  context?: AuditContext;
};

export type ResolvedAuditTarget = {
  targetId: string | null;
  targetKey: string;
  metadata: Prisma.InputJsonObject;
};

export function reportAuditFailure(error: unknown, context: AuditContext): void {
  try {
    Sentry.captureException(error, {
      extra: {
        subsystem: 'audit_log',
        ...context,
      },
    });
  } catch {
    // Sentry itself is best-effort. A reporter failure must not reintroduce
    // the production outage this isolation boundary exists to prevent.
  }
}

export function resolveAuditTarget(input: AuditTargetInput): ResolvedAuditTarget {
  const suppliedTargetId = input.targetId ?? null;

  if (suppliedTargetId && !UUID_PATTERN.test(suppliedTargetId)) {
    const error = new Error(`AuditLog.targetId must be a UUID: ${suppliedTargetId}`);

    if (process.env.NODE_ENV !== 'production') {
      throw error;
    }

    try {
      Sentry.captureMessage('Invalid AuditLog.targetId was downgraded to metadata.target_key', {
        level: 'warning',
        extra: {
          subsystem: 'audit_log',
          invalidTargetId: suppliedTargetId,
          ...input.context,
        },
      });
    } catch {
      // The invalid target was still downgraded safely even if Sentry failed.
    }

    return {
      targetId: null,
      targetKey: suppliedTargetId,
      metadata: {
        ...(input.metadata ?? {}),
        target_key: suppliedTargetId,
      } as Prisma.InputJsonObject,
    };
  }

  return {
    targetId: suppliedTargetId,
    targetKey: input.targetKey,
    metadata: {
      ...(input.metadata ?? {}),
      target_key: input.targetKey,
    } as Prisma.InputJsonObject,
  };
}

function auditTargetWhere(target: ResolvedAuditTarget): Prisma.AuditLogWhereInput {
  if (target.targetId) return { targetId: target.targetId };

  return {
    targetId: null,
    metadata: {
      path: ['target_key'],
      equals: target.targetKey,
    },
  };
}

type WriteAuditInput = {
  tenantId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  targetKey: string;
  metadata?: Record<string, unknown>;
  createdAtSince?: Date;
};

export async function writeAuditIfMissing(input: WriteAuditInput): Promise<void> {
  const target = resolveAuditTarget({
    targetId: input.targetId,
    targetKey: input.targetKey,
    metadata: input.metadata,
    context: {
      action: input.action,
      targetType: input.targetType,
    },
  });
  const existing = await prisma.auditLog.findFirst({
    where: {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      ...auditTargetWhere(target),
      ...(input.createdAtSince ? { createdAt: { gte: input.createdAtSince } } : {}),
    },
    select: { id: true },
  });
  if (existing) return;

  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: target.targetId,
      metadata: {
        ...target.metadata,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

export async function createAudit(input: WriteAuditInput): Promise<void> {
  const target = resolveAuditTarget({
    targetId: input.targetId,
    targetKey: input.targetKey,
    metadata: input.metadata,
    context: {
      action: input.action,
      targetType: input.targetType,
    },
  });

  await prisma.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: target.targetId,
      metadata: {
        ...target.metadata,
        timestamp: new Date().toISOString(),
      },
    },
  });
}

export async function runAuditBestEffort(
  context: AuditContext,
  writer: () => Promise<void>,
): Promise<void> {
  try {
    await writer();
  } catch (error) {
    reportAuditFailure(error, context);
  }
}
