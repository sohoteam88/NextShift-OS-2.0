-- U3B: platform evidence is deliberately not tenant-owned, so a tenant cascade
-- cannot erase a platform lifecycle event.
CREATE TYPE "AuditScope" AS ENUM ('TENANT', 'PLATFORM');

ALTER TABLE "audit_logs"
  ADD COLUMN "scope" "AuditScope" NOT NULL DEFAULT 'TENANT',
  ALTER COLUMN "tenant_id" DROP NOT NULL,
  ADD COLUMN "idempotency_key" text,
  ADD COLUMN "payload_digest" text,
  ADD COLUMN "retention_until" timestamptz,
  ADD COLUMN "legal_hold" boolean NOT NULL DEFAULT false;

UPDATE "audit_logs" SET "scope" = 'TENANT' WHERE "tenant_id" IS NOT NULL;

-- Existing rows remain null/null for idempotency because historical request
-- identities cannot be reconstructed honestly. Platform events receive the
-- reviewed minimum 24-month retention from their actual creation time.
UPDATE "audit_logs"
SET "retention_until" = "created_at" + interval '24 months'
WHERE "scope" = 'PLATFORM' AND "retention_until" IS NULL;

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
  "idempotency_key" text NOT NULL,
  "payload_digest" text NOT NULL,
  "payload" jsonb NOT NULL,
  "correlation_id" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "attempt_count" integer NOT NULL DEFAULT 0,
  "next_attempt_at" timestamptz NOT NULL DEFAULT now(),
  "claim_token" text,
  "claimed_at" timestamptz,
  "delivered_at" timestamptz,
  "delivered_audit_log_id" text,
  "dead_lettered_at" timestamptz,
  "failure_code" text,
  "last_error" text,
  "alerted_at" timestamptz,
  "retention_until" timestamptz NOT NULL DEFAULT (now() + interval '24 months'),
  "legal_hold" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "audit_event_outbox_digest_check" CHECK (
    "idempotency_key" ~ '^[0-9a-f]{64}$' AND "payload_digest" ~ '^[0-9a-f]{64}$'
  ),
  CONSTRAINT "audit_event_outbox_identity_unique" UNIQUE ("idempotency_key", "payload_digest"),
  CONSTRAINT "audit_event_outbox_status_check" CHECK (
    "status" IN ('pending', 'processing', 'delivered', 'dead_letter')
  ),
  CONSTRAINT "audit_event_outbox_attempt_check" CHECK ("attempt_count" >= 0),
  CONSTRAINT "audit_event_outbox_terminal_check" CHECK (
    ("status" = 'delivered' AND "delivered_at" IS NOT NULL AND "delivered_audit_log_id" IS NOT NULL) OR
    ("status" = 'dead_letter' AND "dead_lettered_at" IS NOT NULL AND "alerted_at" IS NOT NULL) OR
    ("status" IN ('pending', 'processing') AND "delivered_at" IS NULL AND "dead_lettered_at" IS NULL)
  )
);
CREATE INDEX "audit_event_outbox_claim_idx"
  ON "audit_event_outbox" ("status", "next_attempt_at", "created_at");
CREATE INDEX "audit_event_outbox_correlation_idx"
  ON "audit_event_outbox" ("correlation_id", "created_at");

CREATE INDEX "audit_event_outbox_retention_idx"
  ON "audit_event_outbox" ("retention_until")
  WHERE "status" IN ('delivered', 'dead_letter') AND "legal_hold" = false;

-- Audit event identity and payload are immutable. Delivery bookkeeping remains
-- mutable so workers can claim, retry, receipt and dead-letter the event.
CREATE FUNCTION prevent_audit_outbox_payload_mutation() RETURNS trigger AS $$
BEGIN
  IF NEW."idempotency_key" IS DISTINCT FROM OLD."idempotency_key"
     OR NEW."payload_digest" IS DISTINCT FROM OLD."payload_digest"
     OR NEW."payload" IS DISTINCT FROM OLD."payload"
     OR NEW."correlation_id" IS DISTINCT FROM OLD."correlation_id"
     OR NEW."created_at" IS DISTINCT FROM OLD."created_at" THEN
    RAISE EXCEPTION 'audit outbox identity/payload is append-only';
  END IF;
  NEW."updated_at" := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_event_outbox_append_only"
BEFORE UPDATE ON "audit_event_outbox"
FOR EACH ROW EXECUTE FUNCTION prevent_audit_outbox_payload_mutation();

-- Platform AuditLog evidence is append-only. Legal/security hold and retention
-- are the only lifecycle fields that an authorized retention process may alter.
CREATE FUNCTION prevent_platform_audit_mutation() RETURNS trigger AS $$
BEGIN
  IF OLD."scope" = 'PLATFORM' AND (
    NEW."scope" IS DISTINCT FROM OLD."scope" OR
    NEW."tenant_id" IS DISTINCT FROM OLD."tenant_id" OR
    NEW."actor_id" IS DISTINCT FROM OLD."actor_id" OR
    NEW."action" IS DISTINCT FROM OLD."action" OR
    NEW."target_type" IS DISTINCT FROM OLD."target_type" OR
    NEW."target_id" IS DISTINCT FROM OLD."target_id" OR
    NEW."metadata" IS DISTINCT FROM OLD."metadata" OR
    NEW."idempotency_key" IS DISTINCT FROM OLD."idempotency_key" OR
    NEW."payload_digest" IS DISTINCT FROM OLD."payload_digest" OR
    NEW."created_at" IS DISTINCT FROM OLD."created_at"
  ) THEN
    RAISE EXCEPTION 'platform audit evidence is append-only';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "platform_audit_append_only"
BEFORE UPDATE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION prevent_platform_audit_mutation();

CREATE FUNCTION enforce_platform_audit_retention() RETURNS trigger AS $$
BEGIN
  IF OLD."scope" = 'PLATFORM' AND (
    OLD."legal_hold" = true OR OLD."retention_until" IS NULL OR OLD."retention_until" > now()
  ) THEN
    RAISE EXCEPTION 'platform audit retention/hold prevents deletion';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "platform_audit_retention_guard"
BEFORE DELETE ON "audit_logs"
FOR EACH ROW EXECUTE FUNCTION enforce_platform_audit_retention();

CREATE FUNCTION enforce_audit_outbox_retention() RETURNS trigger AS $$
BEGIN
  IF OLD."status" IN ('pending', 'processing') OR OLD."legal_hold" = true OR OLD."retention_until" > now() THEN
    RAISE EXCEPTION 'audit outbox retention/hold prevents deletion';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_outbox_retention_guard"
BEFORE DELETE ON "audit_event_outbox"
FOR EACH ROW EXECUTE FUNCTION enforce_audit_outbox_retention();
