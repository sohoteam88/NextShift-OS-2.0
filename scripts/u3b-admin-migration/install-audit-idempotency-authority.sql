-- Prisma cannot express the immutable U3ADR partial unique index. Fresh
-- `prisma db push` databases (CI/E2E/local schema fixtures) must install this
-- exact authority before any platform audit write is allowed.
DROP INDEX IF EXISTS "audit_logs_idempotency_key_unique";
CREATE UNIQUE INDEX "audit_logs_idempotency_key_unique"
  ON "audit_logs" ("idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;
