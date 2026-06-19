CREATE TABLE IF NOT EXISTS "feedback" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "severity" TEXT,
  "message" TEXT NOT NULL,
  "route" TEXT,
  "metadata" JSONB DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'open',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "feedback_tenant_id_idx" ON "feedback"("tenant_id");
CREATE INDEX IF NOT EXISTS "feedback_status_idx" ON "feedback"("status");
CREATE INDEX IF NOT EXISTS "feedback_type_idx" ON "feedback"("type");
CREATE INDEX IF NOT EXISTS "feedback_created_at_idx" ON "feedback"("created_at" DESC);
