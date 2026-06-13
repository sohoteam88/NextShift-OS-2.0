#!/usr/bin/env bash

set -e

APP_NAME="nextshift-os-staging"

git pull origin main
pnpm install --frozen-lockfile
pnpm db:generate
pnpm exec prisma migrate deploy
pnpm type-check
pnpm lint
pnpm test
pnpm build
pm2 reload "$APP_NAME"
