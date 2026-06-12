CREATE TABLE "user_progress" (
  "id" TEXT NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "current_stage_id" TEXT NOT NULL,
  "completed_checks" JSONB NOT NULL DEFAULT '[]',
  "total_xp" INTEGER NOT NULL DEFAULT 0,
  "mode" TEXT NOT NULL DEFAULT 'guided',
  "stage_started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "last_activity_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "milestones_seen" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "missions" (
  "id" TEXT NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "stage_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "why_it_matters" TEXT NOT NULL,
  "estimated_minutes" INTEGER NOT NULL,
  "route" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "completed_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "achievements" (
  "id" TEXT NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "type" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "icon" TEXT NOT NULL,
  "xp_awarded" INTEGER NOT NULL,
  "unlocked_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_progress_user_id_key" ON "user_progress"("user_id");
CREATE INDEX "user_progress_tenant_id_idx" ON "user_progress"("tenant_id");
CREATE INDEX "missions_tenant_id_user_id_status_idx" ON "missions"("tenant_id", "user_id", "status");
CREATE UNIQUE INDEX "achievements_tenant_id_user_id_key_key" ON "achievements"("tenant_id", "user_id", "key");
CREATE INDEX "achievements_tenant_id_user_id_idx" ON "achievements"("tenant_id", "user_id");

ALTER TABLE "user_progress"
  ADD CONSTRAINT "user_progress_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_progress"
  ADD CONSTRAINT "user_progress_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "missions"
  ADD CONSTRAINT "missions_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "missions"
  ADD CONSTRAINT "missions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "achievements"
  ADD CONSTRAINT "achievements_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "achievements"
  ADD CONSTRAINT "achievements_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
