import { createHash, randomUUID } from 'crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { canonicalizeJson } from '@/lib/security/rfc8785';

const PLATFORM_RETENTION_MONTHS = 24;
const REDACTED = '[REDACTED]';
const SENSITIVE_KEY = /authorization|cookie|password|secret|token|credential|api[_-]?key/i;

type AuditDatabase = Pick<PrismaClient, '$queryRaw' | '$executeRaw'>;

export type PlatformAuditInput = {
  actorId: string;
  actorRole: 'platform_admin';
  action: string;
  targetType: string;
  targetId?: string | null;
  targetKey: string;
  outcome: 'success' | 'failure';
  correlationId?: string;
  /** @deprecated Correlation ID is the canonical logical-attempt identity. */
  idempotencyIdentity?: string;
  metadata?: Record<string, unknown>;
  metadataProfile?: 'tenant_deletion_snapshot';
};

export type PlatformAuditEvent = ReturnType<typeof buildPlatformAuditEvent>;

type PersistedAuditRow = {
  id: string;
  idempotencyKey: string;
  payloadDigest: string;
  createdAt: Date;
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      SENSITIVE_KEY.test(key) ? REDACTED : redact(entry),
    ]));
  }
  return value;
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
  const metadata = redact(input.metadata ?? {}) as Record<string, unknown>;
  const payload = {
    ...identity,
    actorId: input.actorId,
    actorRole: input.actorRole,
    targetId: input.targetId ?? null,
    metadata,
    ...(input.metadataProfile ? { metadataProfile: input.metadataProfile } : {}),
  };
  return {
    correlationId,
    identity,
    payload,
    metadata,
    idempotencyKey: sha256(canonicalizeJson(identity)),
    payloadDigest: sha256(canonicalizeJson(payload)),
  };
}

async function enqueueAuditOutbox(
  db: AuditDatabase,
  event: PlatformAuditEvent,
  options: { deadLetter?: boolean; failureCode: string; error?: string },
): Promise<void> {
  const now = new Date();
  const deadLetter = options.deadLetter === true;
  const outboxId = randomUUID();
  const alertId = randomUUID();
  if (deadLetter) {
    await db.$executeRaw(Prisma.sql`
      WITH inserted AS (
        INSERT INTO "audit_event_outbox" (
          "id", "idempotency_key", "payload_digest", "payload", "correlation_id",
          "status", "attempt_count", "next_attempt_at", "dead_lettered_at",
          "failure_code", "last_error", "alerted_at", "retention_until",
          "legal_hold", "created_at", "updated_at"
        ) VALUES (
          ${outboxId}, ${event.idempotencyKey}, ${event.payloadDigest},
          CAST(${canonicalizeJson(event.payload)} AS jsonb), ${event.correlationId},
          'dead_letter', 1, ${now}, ${now}, ${options.failureCode},
          ${options.error?.slice(0, 500) ?? null}, NULL,
          ${addMonths(now, PLATFORM_RETENTION_MONTHS)}, false, ${now}, ${now}
        )
        ON CONFLICT ("idempotency_key", "payload_digest") DO UPDATE
          SET "updated_at" = "audit_event_outbox"."updated_at"
        RETURNING "id", "correlation_id", "payload_digest", "failure_code"
      )
      INSERT INTO "audit_operational_alerts" (
        "id", "outbox_event_id", "correlation_id", "alert_type", "severity",
        "payload_digest", "payload", "retention_until", "created_at", "updated_at"
      )
      SELECT ${alertId}, inserted."id", inserted."correlation_id",
        COALESCE(inserted."failure_code", 'AUDIT_DEAD_LETTER'), 'critical',
        inserted."payload_digest",
        jsonb_build_object('outbox_event_id', inserted."id", 'correlation_id', inserted."correlation_id",
          'failure_code', inserted."failure_code"),
        ${addMonths(now, PLATFORM_RETENTION_MONTHS)}, ${now}, ${now}
      FROM inserted
      ON CONFLICT ("outbox_event_id") DO NOTHING
    `);
    return;
  }
  await db.$executeRaw(Prisma.sql`
    INSERT INTO "audit_event_outbox" (
      "id", "idempotency_key", "payload_digest", "payload", "correlation_id",
      "status", "attempt_count", "next_attempt_at", "dead_lettered_at",
      "failure_code", "last_error", "alerted_at", "retention_until",
      "legal_hold", "created_at", "updated_at"
    ) VALUES (
      ${outboxId}, ${event.idempotencyKey}, ${event.payloadDigest},
      CAST(${canonicalizeJson(event.payload)} AS jsonb), ${event.correlationId},
      ${deadLetter ? 'dead_letter' : 'pending'}, ${deadLetter ? 1 : 0}, ${now},
      NULL, ${options.failureCode}, ${options.error?.slice(0, 500) ?? null},
      NULL, ${addMonths(now, PLATFORM_RETENTION_MONTHS)}, false, ${now}, ${now}
    )
    ON CONFLICT ("idempotency_key", "payload_digest") DO NOTHING
  `);
}

/**
 * Database-authoritative insert. The partial unique index decides concurrent
 * ownership; there is deliberately no application find-before-create path.
 */
export async function persistPlatformAuditAtomic(
  db: AuditDatabase,
  input: PlatformAuditInput,
): Promise<PersistedAuditRow> {
  const event = buildPlatformAuditEvent(input);
  const now = new Date();
  const storedMetadata = input.metadataProfile === 'tenant_deletion_snapshot'
    ? event.metadata
    : {
        ...event.metadata,
        actor_role: input.actorRole,
        outcome: input.outcome,
        correlation_id: event.correlationId,
        target_key: input.targetKey,
      };
  const inserted = await db.$queryRaw<PersistedAuditRow[]>(Prisma.sql`
    INSERT INTO "audit_logs" (
      "id", "tenant_id", "scope", "actor_id", "action", "target_type",
      "target_id", "metadata", "idempotency_key", "payload_digest",
      "retention_until", "legal_hold", "created_at"
    ) VALUES (
      ${randomUUID()}, NULL, CAST('PLATFORM' AS "AuditScope"), ${input.actorId}::uuid,
      ${input.action}, ${input.targetType}, ${input.targetId ?? null}::uuid,
      CAST(${canonicalizeJson(storedMetadata)} AS jsonb),
      ${event.idempotencyKey}, ${event.payloadDigest},
      ${addMonths(now, PLATFORM_RETENTION_MONTHS)}, false, ${now}
    )
    ON CONFLICT ("idempotency_key") WHERE "idempotency_key" IS NOT NULL DO NOTHING
    RETURNING "id", "idempotency_key" AS "idempotencyKey",
      "payload_digest" AS "payloadDigest", "created_at" AS "createdAt"
  `);

  if (inserted[0]) return inserted[0];

  const existing = await db.$queryRaw<PersistedAuditRow[]>(Prisma.sql`
    SELECT "id", "idempotency_key" AS "idempotencyKey",
      "payload_digest" AS "payloadDigest", "created_at" AS "createdAt"
    FROM "audit_logs"
    WHERE "idempotency_key" = ${event.idempotencyKey}
    LIMIT 1
  `);
  if (existing[0]?.payloadDigest === event.payloadDigest) return existing[0];

  throw new AppError('AUDIT_IDEMPOTENCY_CONFLICT', 503, 'Audit event payload conflict', {
    correlationId: event.correlationId,
    idempotencyKey: event.idempotencyKey,
    payloadDigest: event.payloadDigest,
  });
}

/** Use inside a business transaction when audit success must commit atomically. */
export function writePlatformAuditInTransaction(
  tx: Prisma.TransactionClient,
  input: PlatformAuditInput,
): Promise<PersistedAuditRow> {
  return persistPlatformAuditAtomic(tx, input);
}

/**
 * Isolated direct-write path. A failed direct write is durably enqueued; if
 * neither authority can persist, the caller receives 503 and must not report
 * the business mutation as successful.
 */
export async function writePlatformAudit(input: PlatformAuditInput): Promise<PersistedAuditRow> {
  return writePlatformAuditUsing(prisma, input);
}

export async function writePlatformAuditUsing(
  db: AuditDatabase,
  input: PlatformAuditInput,
): Promise<PersistedAuditRow> {
  const event = buildPlatformAuditEvent(input);
  try {
    return await persistPlatformAuditAtomic(db, input);
  } catch (error) {
    const conflict = error instanceof AppError && error.code === 'AUDIT_IDEMPOTENCY_CONFLICT';
    try {
      await enqueueAuditOutbox(db, event, {
        deadLetter: conflict,
        failureCode: conflict ? 'AUDIT_IDEMPOTENCY_CONFLICT' : 'AUDIT_DIRECT_WRITE_FAILED',
        error: error instanceof Error ? error.message : 'unknown audit write failure',
      });
    } catch {
      throw new AppError('AUDIT_UNAVAILABLE', 503, 'Audit persistence unavailable', {
        correlationId: event.correlationId,
      });
    }
    if (conflict) throw error;
    throw new AppError('AUDIT_DEFERRED', 503, 'Audit delivery deferred', {
      correlationId: event.correlationId,
    });
  }
}
