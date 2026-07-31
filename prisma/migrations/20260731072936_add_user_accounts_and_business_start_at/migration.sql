/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SocialPlatform" AS ENUM ('fb', 'ig', 'xiaohongshu', 'tiktok');

-- CreateEnum
CREATE TYPE "AccountTrack" AS ENUM ('recruitment', 'retail');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "business_start_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "user_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "platform" "SocialPlatform" NOT NULL,
    "track" "AccountTrack" NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_accounts_tenant_id_user_id_idx" ON "user_accounts"("tenant_id", "user_id");

-- CreateIndex
CREATE INDEX "user_accounts_user_id_enabled_idx" ON "user_accounts"("user_id", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "user_accounts_user_id_platform_track_key" ON "user_accounts"("user_id", "platform", "track");

-- CreateIndex
CREATE UNIQUE INDEX "users_tenant_id_id_key" ON "users"("tenant_id", "id");

-- AddForeignKey
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_accounts" ADD CONSTRAINT "user_accounts_tenant_id_user_id_fkey" FOREIGN KEY ("tenant_id", "user_id") REFERENCES "users"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE;
