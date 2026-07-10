# NextShift OS VPS Staging Deployment Audit

## Scope

This audit prepares NextShift OS 2.0 for a staging VPS deployment at `staging.nextshiftos.com` or `app.nextshiftos.com`. It does not change business logic.

## Runtime Summary

- Framework: Next.js 15 with App Router
- Package manager: `pnpm@10.24.0`
- Node runtime: Node.js LTS recommended
- Process manager: PM2
- Reverse proxy: Nginx
- Database: PostgreSQL via Supabase
- ORM: Prisma `6.19.3`
- Build output: Next.js standalone mode from `next.config.mjs`

## Package Scripts

Required scripts are available:

- `pnpm build`: production build
- `pnpm start`: `next start`
- `pnpm type-check`: TypeScript validation
- `pnpm test`: Vitest test suite
- `pnpm db:generate`: Prisma Client generation
- `pnpm db:migrate`: local development migration command

Deployment note: `db:migrate` maps to `prisma migrate dev`, so staging/prod deployment should run `pnpm exec prisma migrate deploy` rather than `pnpm db:migrate`.

Risk: `pnpm lint` maps to `next lint`. Confirm the installed Next.js version still supports this command in the target environment before making lint a hard deployment gate.

Current local build risk observed during this audit: `pnpm build` compiles successfully, then fails ESLint on `src/modules/whatsapp-ai/components/WhatsAppDashboard.tsx` because of unescaped quotes in JSX text. This is outside the deployment-file scope and should be fixed before using lint/build as a staging deployment gate.

## Next.js Config

Config file: `next.config.mjs`

Important settings:

- `output: 'standalone'`
- `reactStrictMode: true`
- `next-intl` plugin enabled
- Remote images allowed for `https` and `http`

Build command:

```bash
pnpm build
```

Start command for PM2:

```bash
pm2 start ecosystem.config.js
```

## Prisma And Database

Schema file: `prisma/schema.prisma`

Datasource:

- `DATABASE_URL`
- `DIRECT_URL`

Staging database requirements:

- Use a staging Supabase project or a staging database branch when possible.
- Do not point staging at production data unless that is intentional and documented.
- Run Prisma migrations with `pnpm exec prisma migrate deploy`.
- Run `pnpm db:generate` before build.

Database risks:

- `DIRECT_URL` is required by the current Prisma datasource.
- Supabase connection pooler URLs and direct database URLs may need different hostnames and ports.
- Migration permissions must be available to the database user used by deployment.

## Required Environment Variables

### App

- `NEXT_PUBLIC_APP_URL`
- `NODE_ENV`
- `NEXT_PUBLIC_SITE_NAME`

### Database

- `DATABASE_URL`
- `DIRECT_URL`

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### AI Providers

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`

### Existing Optional Integrations

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `WHATSAPP_API_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `RESEND_API_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `N8N_WEBHOOK_URL`
- `REDIS_URL`

## Missing Or Confirm Before Deploy

- Confirm staging domain: `staging.nextshiftos.com` or `app.nextshiftos.com`.
- Confirm DNS A record points to the VPS.
- Confirm Supabase Auth Site URL and redirect URLs include the staging domain.
- Confirm all AI keys exist in `.env.production` on the VPS.
- Confirm no real secrets are committed.
- Confirm whether staging should use production Supabase or a separate staging database.

## Auth Callback URLs

Supabase Auth should include:

- `https://staging.nextshiftos.com`
- `https://staging.nextshiftos.com/login`
- `https://staging.nextshiftos.com/auth/callback` if callback routes are enabled
- The equivalent `app.nextshiftos.com` URLs if that domain is used instead

The app should set:

```bash
NEXT_PUBLIC_APP_URL=https://staging.nextshiftos.com
NEXTAUTH_URL=https://staging.nextshiftos.com
```

## Public Runtime Variables

These are exposed to the browser and must not contain secrets:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_NAME`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Recommended VPS Setup

- Ubuntu 22.04 or 24.04
- Node.js LTS
- Corepack enabled
- pnpm activated through Corepack
- PM2 installed globally
- Nginx as reverse proxy
- Certbot for SSL
- UFW firewall enabled with SSH, HTTP, and HTTPS allowed
- `.env.production` stored only on VPS and excluded from Git

## Deployment Risks

- Running migrations against the wrong Supabase database.
- Missing Supabase redirect URLs causing login confirmation or callback failures.
- Missing AI provider keys causing AI features to fail while the app itself still runs.
- PM2 starting without loading the intended production env file.
- `pnpm lint` may fail if `next lint` support differs in the deployed Next.js version.

## DEPLOY-0 Production Pipeline Update

Date: 2026-07-10

The production deploy path now targets the Docker-based Runtime Platform deployment instead of the older PM2-oriented staging notes above.

Changes introduced:

- Docker build arguments now include all public production build-time variables discovered in the repository:
  - `NEXT_PUBLIC_APP_URL`
  - `NEXT_PUBLIC_BASE_DOMAIN`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6`
  - `NEXT_PUBLIC_ENABLE_RUNTIME_REVENUE`
  - `NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS`
  - `NEXT_PUBLIC_ENABLE_RUNTIME_MISSION`
- The deploy workflow passes production build values from `PROD_` GitHub secrets and non-secret feature flags from GitHub variables.
- The deploy workflow preserves the current image as `nextshift-app:previous` before promoting the new image to `nextshift-app:latest`.
- The deploy workflow copies the Prisma schema and migrations to the VPS with each deployment package so a clean VPS directory can run migrations deterministically.
- The deploy workflow runs `prisma migrate deploy` in a temporary container before `docker compose up`.
- The old failure-triggered `rollback` notification job is now named `ci-failure-notice`.
- A real `workflow_dispatch` rollback job now retags `nextshift-app:previous` to `nextshift-app:latest`, recreates the app service, and runs smoke checks.
- `scripts/deploy-smoke.sh` validates `/api/health`, `/api/v1/version`, and `/login` after deploy or rollback.

Required GitHub secrets and variables are documented in [production-deployment-secrets.md](production-deployment-secrets.md).
