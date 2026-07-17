import { createHash, randomUUID } from 'crypto';
import { Prisma, type AuditScope } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export type PlatformAuditInput = {
  actorId: string;
  actorRole: 'platform_admin';
  action: string;
  targetType: string;
  targetId?: string | null;
  targetKey: string;
  outcome: 'success' | 'failure';
  correlationId?: string;
  metadata?: Record<string, unknown>;
};

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(',')}}`;
}

function digest(value: unknown) {
  return createHash('sha256').update(canonicalize(value)).digest('hex');
}

export function buildPlatformAuditEvent(input: PlatformAuditInput) {
  const correlationId = input.correlationId ?? randomUUID();
  const identity = {
    version: 1,
    correlationId,
    scope: 'PLATFORM',
    action: input.action,
    targetType: input.targetType,
    targetKey: input.targetKey,
    outcome: input.outcome,
  };
  const payload = {
    ...identity,
    actorId: input.actorId,
    actorRole: input.actorRole,
    targetId: input.targetId ?? null,
    metadata: input.metadata ?? {},
  };
  return { correlationId, payload, idempotencyKey: digest(identity), payloadDigest: digest(payload) };
}

export async function writePlatformAudit(input: PlatformAuditInput) {
  const event = buildPlatformAuditEvent(input);
  try {
    const existing = await prisma.auditLog.findFirst({ where: { idempotencyKey: event.idempotencyKey } });
    if (existing) {
      if (existing.payloadDigest !== event.payloadDigest) {
        throw new AppError('AUDIT_IDEMPOTENCY_CONFLICT', 503, 'Audit event payload conflict');
      }
      return existing;
    }
    return await prisma.auditLog.create({
      data: {
        scope: 'PLATFORM' as AuditScope,
        tenantId: null,
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        metadata: { ...input.metadata, actor_role: input.actorRole, outcome: input.outcome, correlation_id: event.correlationId, target_key: input.targetKey } as Prisma.InputJsonValue,
        idempotencyKey: event.idempotencyKey,
        payloadDigest: event.payloadDigest,
      },
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    try {
      await prisma.auditEventOutbox.create({
        data: {
          id: randomUUID(),
          idempotencyKey: event.idempotencyKey,
          payloadDigest: event.payloadDigest,
          payload: event.payload as Prisma.InputJsonValue,
          correlationId: event.correlationId,
          failureCode: 'AUDIT_DIRECT_WRITE_FAILED',
        },
      });
    } catch {
      throw new AppError('AUDIT_UNAVAILABLE', 503, `Audit persistence unavailable (${event.correlationId})`);
    }
    throw new AppError('AUDIT_DEFERRED', 503, `Audit delivery deferred (${event.correlationId})`);
  }
}
