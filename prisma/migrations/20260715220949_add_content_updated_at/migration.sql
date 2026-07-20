-- E2 Content Library needs a durable last-modified timestamp. Add the column
-- nullable first so existing rows can retain their historical creation time.
ALTER TABLE "contents"
ADD COLUMN "updated_at" TIMESTAMPTZ(6);

UPDATE "contents"
SET "updated_at" = "created_at"
WHERE "updated_at" IS NULL;

ALTER TABLE "contents"
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET NOT NULL;

-- Member queries are tenant + owner scoped. Operator and platform-admin
-- queries are tenant scoped. Both use updated_at DESC, id DESC ordering.
CREATE INDEX "contents_tenant_id_owner_id_updated_at_id_idx"
ON "contents"("tenant_id", "owner_id", "updated_at", "id");

CREATE INDEX "contents_tenant_id_updated_at_id_idx"
ON "contents"("tenant_id", "updated_at", "id");
