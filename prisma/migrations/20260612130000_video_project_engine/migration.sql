CREATE TABLE "video_projects" (
  "id" TEXT NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "calendar_id" TEXT,
  "topic" TEXT NOT NULL,
  "content_pillar" TEXT NOT NULL,
  "funnel_stage" TEXT NOT NULL,
  "platform" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "style" TEXT NOT NULL,
  "strategy" JSONB NOT NULL,
  "master_script" JSONB NOT NULL,
  "shot_list" JSONB,
  "broll_list" JSONB,
  "veo_prompt" TEXT,
  "minimax_prompt" TEXT,
  "capcut_script" JSONB,
  "subtitle_srt" TEXT,
  "platform_adaptations" JSONB,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "performance_id" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "video_projects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "video_projects_tenant_id_user_id_idx" ON "video_projects"("tenant_id", "user_id");
CREATE INDEX "video_projects_tenant_id_user_id_status_idx" ON "video_projects"("tenant_id", "user_id", "status");

ALTER TABLE "video_projects"
  ADD CONSTRAINT "video_projects_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "video_projects"
  ADD CONSTRAINT "video_projects_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
