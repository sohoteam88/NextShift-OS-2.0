import { randomUUID } from 'crypto';
import { Prisma, type PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import {
  buildPlatformAuditEvent,
  persistPlatformAuditAtomic,
  type PlatformAuditInput,
} from '@/modules/admin/services/platform-audit-service';

const MAX_ATTEMPTS = 8;
const CLAIM_LEASE_SECONDS = 300;
const MAX_BACKOFF_SECONDS = 3600;

type WorkerDatabase = Pick<PrismaClient, '$queryRaw' | '$executeRaw'>;

type ClaimedEvent = {
  id: string;
  idempotencyKey: string;
  payloadDigest: string;
  payload: Record<string, unknown>;
  correlationId: string;
  attemptCount: number;
  claimToken: string;
};

export type ClaimedOperationalAlert = {
  id: string;
  outboxEventId: string;
  correlationId: string;
  alertType: string;
  severity: string;
  payload: Record<string, unknown>;
  attemptCount: number;
  claimToken: string;
};

export type OperationalAlertTransport = (alert: ClaimedOperationalAlert) => Promise<{ receipt: string }>;

function asPlatformAuditInput(row: ClaimedEvent): PlatformAuditInput {
  const payload = row.payload;
  if (
    payload.scope !== 'PLATFORM' || payload.actorRole !== 'platform_admin' ||
    (payload.outcome !== 'success' && payload.outcome !== 'failure') ||
    typeof payload.actorId !== 'string' || typeof payload.action !== 'string' ||
    typeof payload.targetType !== 'string' || typeof payload.targetKey !== 'string' ||
    typeof payload.correlationId !== 'string'
  ) {
    throw new AppError('AUDIT_OUTBOX_INVALID_PAYLOAD', 503, 'Invalid platform audit outbox payload');
  }
  return {
    actorId: payload.actorId,
    actorRole: 'platform_admin',
    action: payload.action,
    targetType: payload.targetType,
    targetKey: payload.targetKey,
    targetId: typeof payload.targetId === 'string' ? payload.targetId : null,
    outcome: payload.outcome,
    correlationId: payload.correlationId,
    metadata: payload.metadata && typeof payload.metadata === 'object'
      ? payload.metadata as Record<string, unknown>
      : {},
    metadataProfile: payload.metadataProfile === 'tenant_deletion_snapshot'
      ? 'tenant_deletion_snapshot'
      : undefined,
  };
}

export async function claimNextAuditEvent(db: WorkerDatabase = prisma): Promise<ClaimedEvent | null> {
  const claimToken = randomUUID();
  const rows = await db.$queryRaw<ClaimedEvent[]>(Prisma.sql`
    WITH candidate AS (
      SELECT "id"
      FROM "audit_event_outbox"
      WHERE (
        ("status" = 'pending' AND "next_attempt_at" <= now()) OR
        ("status" = 'processing' AND "claimed_at" < now() - (${CLAIM_LEASE_SECONDS} * interval '1 second'))
      )
      AND NOT EXISTS (
        SELECT 1 FROM "audit_event_outbox" AS earlier
        WHERE earlier."correlation_id" = "audit_event_outbox"."correlation_id"
          AND (earlier."created_at", earlier."id") < ("audit_event_outbox"."created_at", "audit_event_outbox"."id")
          AND earlier."status" IN ('pending', 'processing')
      )
      ORDER BY "created_at" ASC, "id" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE "audit_event_outbox" AS event
    SET "status" = 'processing', "claim_token" = ${claimToken},
        "claimed_at" = now(), "updated_at" = now()
    FROM candidate
    WHERE event."id" = candidate."id"
    RETURNING event."id", event."idempotency_key" AS "idempotencyKey",
      event."payload_digest" AS "payloadDigest", event."payload",
      event."correlation_id" AS "correlationId",
      event."attempt_count" AS "attemptCount", event."claim_token" AS "claimToken"
  `);
  return rows[0] ?? null;
}

async function markDelivered(db: WorkerDatabase, row: ClaimedEvent, auditLogId: string): Promise<void> {
  const count = await db.$executeRaw(Prisma.sql`
    UPDATE "audit_event_outbox"
    SET "status" = 'delivered', "attempt_count" = "attempt_count" + 1,
        "delivered_at" = now(), "delivered_audit_log_id" = ${auditLogId},
        "claim_token" = NULL, "claimed_at" = NULL, "last_error" = NULL,
        "updated_at" = now()
    WHERE "id" = ${row.id} AND "status" = 'processing' AND "claim_token" = ${row.claimToken}
  `);
  if (count !== 1) throw new AppError('AUDIT_OUTBOX_CLAIM_LOST', 503, 'Audit outbox claim ownership changed');
}

async function markFailure(db: WorkerDatabase, row: ClaimedEvent, error: unknown): Promise<void> {
  const attempt = row.attemptCount + 1;
  const conflict = error instanceof AppError && error.code === 'AUDIT_IDEMPOTENCY_CONFLICT';
  const invalid = error instanceof AppError && error.code === 'AUDIT_OUTBOX_INVALID_PAYLOAD';
  const deadLetter = conflict || invalid || attempt >= MAX_ATTEMPTS;
  const backoff = Math.min(2 ** Math.max(attempt - 1, 0), MAX_BACKOFF_SECONDS);
  const message = error instanceof Error ? error.message.slice(0, 500) : 'unknown replay failure';
  if (deadLetter) {
    const alertId = randomUUID();
    const updated = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      WITH failed AS (
        UPDATE "audit_event_outbox"
        SET "status" = 'dead_letter', "attempt_count" = ${attempt},
            "next_attempt_at" = now() + (${backoff} * interval '1 second'),
            "dead_lettered_at" = now(), "alerted_at" = NULL,
            "failure_code" = ${conflict ? 'AUDIT_IDEMPOTENCY_CONFLICT' : invalid ? 'AUDIT_OUTBOX_INVALID_PAYLOAD' : 'AUDIT_REPLAY_FAILED'},
            "last_error" = ${message}, "claim_token" = NULL, "claimed_at" = NULL,
            "updated_at" = now()
        WHERE "id" = ${row.id} AND "status" = 'processing' AND "claim_token" = ${row.claimToken}
        RETURNING "id", "correlation_id", "payload_digest", "failure_code", "retention_until"
      ), alerted AS (
        INSERT INTO "audit_operational_alerts" (
          "id", "outbox_event_id", "correlation_id", "alert_type", "severity",
          "payload_digest", "payload", "retention_until", "created_at", "updated_at"
        )
        SELECT ${alertId}, failed."id", failed."correlation_id", failed."failure_code", 'critical',
          failed."payload_digest",
          jsonb_build_object('outbox_event_id', failed."id", 'correlation_id', failed."correlation_id",
            'failure_code', failed."failure_code"),
          failed."retention_until", now(), now()
        FROM failed
        ON CONFLICT ("outbox_event_id") DO NOTHING
        RETURNING "outbox_event_id"
      )
      SELECT "id" FROM failed
    `);
    if (updated.length !== 1) throw new AppError('AUDIT_OUTBOX_CLAIM_LOST', 503, 'Audit outbox claim ownership changed');
    return;
  }
  const count = await db.$executeRaw(Prisma.sql`
    UPDATE "audit_event_outbox"
    SET "status" = 'pending',
        "attempt_count" = ${attempt},
        "next_attempt_at" = now() + (${backoff} * interval '1 second'),
        "dead_lettered_at" = NULL, "alerted_at" = NULL,
        "failure_code" = 'AUDIT_REPLAY_FAILED',
        "last_error" = ${message}, "claim_token" = NULL, "claimed_at" = NULL,
        "updated_at" = now()
    WHERE "id" = ${row.id} AND "status" = 'processing' AND "claim_token" = ${row.claimToken}
  `);
  if (count !== 1) throw new AppError('AUDIT_OUTBOX_CLAIM_LOST', 503, 'Audit outbox claim ownership changed');
}

export async function claimNextOperationalAlert(db: WorkerDatabase = prisma): Promise<ClaimedOperationalAlert | null> {
  const claimToken = randomUUID();
  const rows = await db.$queryRaw<ClaimedOperationalAlert[]>(Prisma.sql`
    WITH candidate AS (
      SELECT "id" FROM "audit_operational_alerts"
      WHERE ("status" = 'pending' AND "next_attempt_at" <= now())
         OR ("status" = 'processing' AND "claimed_at" < now() - (${CLAIM_LEASE_SECONDS} * interval '1 second'))
      ORDER BY "created_at" ASC, "id" ASC
      FOR UPDATE SKIP LOCKED LIMIT 1
    )
    UPDATE "audit_operational_alerts" AS alert
    SET "status" = 'processing', "claim_token" = ${claimToken}, "claimed_at" = now(), "updated_at" = now()
    FROM candidate WHERE alert."id" = candidate."id"
    RETURNING alert."id", alert."outbox_event_id" AS "outboxEventId",
      alert."correlation_id" AS "correlationId", alert."alert_type" AS "alertType",
      alert."severity", alert."payload", alert."attempt_count" AS "attemptCount",
      alert."claim_token" AS "claimToken"
  `);
  return rows[0] ?? null;
}

export async function deliverClaimedOperationalAlert(
  alert: ClaimedOperationalAlert,
  transport: OperationalAlertTransport,
  db: WorkerDatabase = prisma,
): Promise<'delivered' | 'retry'> {
  try {
    const { receipt } = await transport(alert);
    if (!receipt || receipt.length > 500) throw new AppError('AUDIT_ALERT_INVALID_RECEIPT', 503, 'Alert transport returned no durable receipt');
    const rows = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
      WITH delivered AS (
        UPDATE "audit_operational_alerts"
        SET "status" = 'delivered', "attempt_count" = "attempt_count" + 1,
            "delivered_at" = now(), "delivery_receipt" = ${receipt},
            "claim_token" = NULL, "claimed_at" = NULL, "last_error" = NULL, "updated_at" = now()
        WHERE "id" = ${alert.id} AND "status" = 'processing' AND "claim_token" = ${alert.claimToken}
        RETURNING "id", "outbox_event_id"
      ), receipted AS (
        UPDATE "audit_event_outbox" AS event SET "alerted_at" = now(), "updated_at" = now()
        FROM delivered WHERE event."id" = delivered."outbox_event_id"
        RETURNING event."id"
      ) SELECT "id" FROM delivered
    `);
    if (rows.length !== 1) throw new AppError('AUDIT_ALERT_CLAIM_LOST', 503, 'Alert claim ownership changed');
    return 'delivered';
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : 'unknown alert delivery failure';
    const count = await db.$executeRaw(Prisma.sql`
      UPDATE "audit_operational_alerts"
      SET "status" = 'pending', "attempt_count" = "attempt_count" + 1,
          "next_attempt_at" = now() + (LEAST(power(2, "attempt_count"), ${MAX_BACKOFF_SECONDS}) * interval '1 second'),
          "claim_token" = NULL, "claimed_at" = NULL, "last_error" = ${message}, "updated_at" = now()
      WHERE "id" = ${alert.id} AND "status" = 'processing' AND "claim_token" = ${alert.claimToken}
    `);
    if (count !== 1) throw error;
    return 'retry';
  }
}

export async function runOperationalAlertBatch(
  transport: OperationalAlertTransport,
  options: { limit?: number; db?: WorkerDatabase } = {},
) {
  const db = options.db ?? prisma;
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const result = { claimed: 0, delivered: 0, retry: 0 };
  for (let index = 0; index < limit; index += 1) {
    const alert = await claimNextOperationalAlert(db);
    if (!alert) break;
    result.claimed += 1;
    const status = await deliverClaimedOperationalAlert(alert, transport, db);
    result[status] += 1;
  }
  return result;
}

export async function deliverClaimedAuditEvent(row: ClaimedEvent, db: WorkerDatabase = prisma): Promise<'delivered' | 'retry' | 'dead_letter'> {
  try {
    const input = asPlatformAuditInput(row);
    const rebuilt = buildPlatformAuditEvent(input);
    if (rebuilt.idempotencyKey !== row.idempotencyKey || rebuilt.payloadDigest !== row.payloadDigest) {
      throw new AppError('AUDIT_OUTBOX_INVALID_PAYLOAD', 503, 'Outbox identity or payload digest mismatch');
    }
    const persisted = await persistPlatformAuditAtomic(db, input);
    await markDelivered(db, row, persisted.id);
    return 'delivered';
  } catch (error) {
    await markFailure(db, row, error);
    const terminal = error instanceof AppError && [
      'AUDIT_IDEMPOTENCY_CONFLICT',
      'AUDIT_OUTBOX_INVALID_PAYLOAD',
    ].includes(error.code) || row.attemptCount + 1 >= MAX_ATTEMPTS;
    return terminal ? 'dead_letter' : 'retry';
  }
}

export async function runAuditOutboxBatch(options: { limit?: number; db?: WorkerDatabase } = {}) {
  const db = options.db ?? prisma;
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 500);
  const result = { claimed: 0, delivered: 0, retry: 0, deadLetter: 0 };
  for (let index = 0; index < limit; index += 1) {
    const event = await claimNextAuditEvent(db);
    if (!event) break;
    result.claimed += 1;
    const status = await deliverClaimedAuditEvent(event, db);
    if (status === 'delivered') result.delivered += 1;
    else if (status === 'retry') result.retry += 1;
    else result.deadLetter += 1;
  }
  return result;
}

/** Pending rows are never purged. Receipts and dead letters obey retention/hold. */
export async function purgeExpiredAuditOutbox(db: WorkerDatabase = prisma): Promise<number> {
  return db.$executeRaw(Prisma.sql`
    DELETE FROM "audit_event_outbox"
    WHERE "status" IN ('delivered', 'dead_letter')
      AND "legal_hold" = false
      AND "retention_until" <= now()
      AND (
        ("status" = 'delivered' AND "delivered_at" <= now() - interval '30 days') OR
        ("status" = 'dead_letter' AND "dead_lettered_at" <= now() - interval '24 months')
      )
  `);
}
