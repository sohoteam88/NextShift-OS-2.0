# Production Deployment Secrets

This document records the GitHub Actions configuration required by `.github/workflows/deploy.yml`.

Production deployment secrets must use the `PROD_` prefix and must not reuse E2E staging secret names. Do not commit real values.

## VPS Access Secrets

| Name | Type | Purpose |
|---|---|---|
| `VPS_HOST` | Secret | Production VPS host for SSH/SCP deployment. |
| `VPS_SSH_KEY` | Secret | Private SSH key for the `deploy` user on the production VPS. |

## Production Build Secrets

These values are passed as Docker build arguments so Next.js can embed public runtime configuration into the production JavaScript bundle.

| Name | Type | Purpose |
|---|---|---|
| `PROD_NEXT_PUBLIC_APP_URL` | Secret | Public production app URL, for example `https://nextshiftos.com`. |
| `PROD_NEXT_PUBLIC_BASE_DOMAIN` | Secret | Public production base domain, for example `nextshiftos.com`. |
| `PROD_NEXT_PUBLIC_SUPABASE_URL` | Secret | Production Supabase project URL. |
| `PROD_NEXT_PUBLIC_SUPABASE_ANON_KEY` | Secret | Production Supabase anon key used by browser/client code. |
| `PROD_NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Secret | Optional Supabase publishable key if the project uses one. |
| `PROD_NEXT_PUBLIC_SENTRY_DSN` | Secret | Browser-visible Sentry DSN. |
| `PROD_NEXT_PUBLIC_POSTHOG_KEY` | Secret | Browser-visible PostHog project key. |
| `PROD_NEXT_PUBLIC_POSTHOG_HOST` | Secret | Browser-visible PostHog host. |
| `PROD_NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Secret | Browser-visible Stripe publishable key. |
| `PROD_SENTRY_AUTH_TOKEN` | Secret | Sentry auth token for source map upload during build. |
| `PROD_SENTRY_ORG` | Secret | Sentry organization slug for source map upload. |
| `PROD_SENTRY_PROJECT` | Secret | Sentry project slug for source map upload. |

## Production Build Variables

Use GitHub repository variables for non-secret feature flags.

| Name | Type | Default | Purpose |
|---|---|---|---|
| `PROD_NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6` | Variable | `false` | Enables Evolution Projection v6 in production bundles. |
| `PROD_NEXT_PUBLIC_ENABLE_RUNTIME_MISSION` | Variable | `true` | Enables Mission Runtime Adapter in production bundles; set to `false` only for rollback or staged production reveal. |
| `PROD_NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE` | Variable | `true` | Enables Business State Runtime Adapter in production bundles; set to `false` only for rollback or staged production reveal. |
| `PROD_NEXT_PUBLIC_ENABLE_RUNTIME_CRM` | Variable | `true` | Enables CRM Runtime Adapter in production bundles; set to `false` only for rollback or staged production reveal. |
| `PROD_NEXT_PUBLIC_ENABLE_COMMAND_CENTER` | Variable | `true` | Enables Command Center recommendation datapath in production bundles; set to `false` only for rollback. |
| `PROD_NEXT_PUBLIC_ENABLE_AI_DISCUSSION` | Variable | `false` | Enables the Command Center "Discuss with AI" service-layer API in production bundles. |

Release note for OS 3.5 G1: the Mission, Business State, CRM, and Command Center flags are default-on at the image/build level. The production VPS `.env.production` file currently contains explicit `NEXT_PUBLIC_ENABLE_RUNTIME_MISSION=false`, `NEXT_PUBLIC_ENABLE_RUNTIME_BUSINESS_STATE=false`, and `NEXT_PUBLIC_ENABLE_RUNTIME_CRM=false` values. Because the env file has higher precedence than image defaults at runtime/deploy time, those three production paths remain OFF after the v3.5.0 deployment until Steven updates the VPS env file. This is the final reveal switch by design, not a defect.

## VPS Runtime Environment

The production VPS still owns runtime-only secrets in `/home/deploy/nextshift/.env.production`, including:

- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- AI provider keys
- payment provider secrets
- Redis configuration

GitHub Actions must not print these values. The deploy workflow runs `prisma migrate deploy` inside a temporary container using the VPS `.env.production` file.

## Rollback

Before each deployment, the current `nextshift-app:latest` image is tagged as `nextshift-app:previous`.

To roll back:

1. Open the `Deploy to Production` workflow in GitHub Actions.
2. Run `workflow_dispatch`.
3. Select `rollback`.

The rollback job retags `nextshift-app:previous` as `nextshift-app:latest`, recreates the app service, and runs `scripts/deploy-smoke.sh`.
