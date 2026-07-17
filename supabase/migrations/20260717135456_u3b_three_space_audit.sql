-- U3B: platform evidence is deliberately not tenant-owned, so a tenant cascade
-- cannot erase a platform lifecycle event.
CREATE TYPE "AuditScope" AS ENUM ('TENANT', 'PLATFORM');

ALTER TABLE "audit_logs"
  ADD COLUMN "scope" "AuditScope" NOT NULL DEFAULT 'TENANT',
  ALTER COLUMN "tenant_id" DROP NOT NULL,
  ADD COLUMN "idempotency_key" text,
  ADD COLUMN "payload_digest" text;

UPDATE "audit_logs" SET "scope" = 'TENANT' WHERE "tenant_id" IS NOT NULL;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_scope_tenant_check"
  CHECK (("scope" = 'TENANT' AND "tenant_id" IS NOT NULL) OR ("scope" = 'PLATFORM' AND "tenant_id" IS NULL)),
  ADD CONSTRAINT "audit_logs_idempotency_digest_check"
  CHECK (("idempotency_key" IS NULL AND "payload_digest" IS NULL) OR
         ("idempotency_key" ~ '^[0-9a-f]{64}$' AND "payload_digest" ~ '^[0-9a-f]{64}$'));

CREATE INDEX "audit_logs_tenant_chronology_idx"
  ON "audit_logs" ("tenant_id", "created_at" DESC) WHERE "scope" = 'TENANT';
CREATE INDEX "audit_logs_platform_chronology_idx"
  ON "audit_logs" ("created_at" DESC) WHERE "scope" = 'PLATFORM';
CREATE UNIQUE INDEX "audit_logs_idempotency_key_unique"
  ON "audit_logs" ("idempotency_key") WHERE "idempotency_key" IS NOT NULL;

CREATE TABLE "audit_event_outbox" (
  "id" text PRIMARY KEY,
  "idempotency_key" text NOT NULL UNIQUE,
  "payload_digest" text NOT NULL,
  "payload" jsonb NOT NULL,
  "correlation_id" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "attempt_count" integer NOT NULL DEFAULT 0,
  "next_attempt_at" timestamptz NOT NULL DEFAULT now(),
  "delivered_at" timestamptz,
  "dead_lettered_at" timestamptz,
  "failure_code" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "audit_event_outbox_digest_check" CHECK (
    "idempotency_key" ~ '^[0-9a-f]{64}$' AND "payload_digest" ~ '^[0-9a-f]{64}$'
  )
);
CREATE INDEX "audit_event_outbox_claim_idx"
  ON "audit_event_outbox" ("status", "next_attempt_at", "created_at");
CREATE INDEX "audit_event_outbox_correlation_idx"
  ON "audit_event_outbox" ("correlation_id", "created_at");
