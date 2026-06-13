CREATE TABLE IF NOT EXISTS "brand_profiles" (
  "id" TEXT NOT NULL,
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "brand_name" TEXT NOT NULL DEFAULT '',
  "personal_name" TEXT NOT NULL DEFAULT '',
  "brand_positioning" TEXT NOT NULL DEFAULT '',
  "slogan" TEXT NOT NULL DEFAULT '',
  "target_audience" TEXT NOT NULL DEFAULT '',
  "audience_pain_points" JSONB NOT NULL DEFAULT '[]',
  "audience_goals" JSONB NOT NULL DEFAULT '[]',
  "audience_objections" JSONB NOT NULL DEFAULT '[]',
  "core_message" TEXT NOT NULL DEFAULT '',
  "unique_angle" TEXT NOT NULL DEFAULT '',
  "elevator_pitch" TEXT NOT NULL DEFAULT '',
  "content_tone" TEXT NOT NULL DEFAULT '温暖亲切',
  "content_pillars" JSONB NOT NULL DEFAULT '[]',
  "storytelling_style" TEXT NOT NULL DEFAULT '',
  "primary_offer" TEXT NOT NULL DEFAULT '',
  "secondary_offer" TEXT NOT NULL DEFAULT '',
  "transformation_promise" TEXT NOT NULL DEFAULT '',
  "brand_colors" JSONB NOT NULL DEFAULT '[]',
  "profile_image_prompt" TEXT NOT NULL DEFAULT '',
  "cover_banner_prompt" TEXT NOT NULL DEFAULT '',
  "confidence_score" INTEGER NOT NULL DEFAULT 0,
  "version" INTEGER NOT NULL DEFAULT 1,
  "published_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "brand_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "brand_profiles_user_id_key" ON "brand_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "brand_profiles_tenant_id_idx" ON "brand_profiles"("tenant_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_profiles_tenant_id_fkey'
  ) THEN
    ALTER TABLE "brand_profiles"
      ADD CONSTRAINT "brand_profiles_tenant_id_fkey"
      FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'brand_profiles_user_id_fkey'
  ) THEN
    ALTER TABLE "brand_profiles"
      ADD CONSTRAINT "brand_profiles_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
