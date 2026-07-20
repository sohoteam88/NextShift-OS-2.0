# Production Deployment Secrets

This document records the GitHub Actions configuration required by `.github/workflows/deploy.yml`.

Production deployment secrets must use the `PROD_` prefix and must not reuse E2E staging secret names. Do not commit real values.

## Manual Production Gate

`Deploy to Production` has no `push`, `pull_request`, `schedule`, or `workflow_run` trigger. A successful CI run cannot start a production action. Both deploy and rollback are available only through an explicit `workflow_dispatch` request, run in the `production` GitHub Environment, and require:

- `action`: `deploy` or `rollback`;
- `release_sha`: an exact 40-character commit SHA contained in `origin/main`;
- `confirmation`: exactly `DEPLOY_PRODUCTION` for deploy or `ROLLBACK_PRODUCTION` for rollback.

The workflow validates the SHA before the production job, checks out that exact SHA, and validates it against `origin/main` again before any build, migration, deploy, or rollback command. Deploy builds and labels the image from that same SHA.

The workflow control plane is separately bound to the exact current `main` commit. Dispatches from branches, tags, or pull-request refs are rejected. If `main` changes while the GitHub Environment approval is pending, the production job fails closed and the operator must create a new dispatch. One immutable `nextshift-production` concurrency lock serializes every deploy and rollback request.

Manual workflow dispatch and GitHub Environment approval are execution safeguards; neither is Steven Release Approval. This change does not create a Release Approval state machine or unlock the repository release gate. Release approval remains a separate governance decision.

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

Every newly built image carries the OCI label `org.opencontainers.image.revision=<release_sha>` and the immutable local tag `nextshift-app:<release_sha>`. The optional `nextshift-app:previous` tag created during deploy is only a convenience reference; it is not rollback authority.

Before the first deployment through this gate, Production Readiness must confirm that an intended exact-SHA rollback image is present on the production host with the matching OCI revision label. This remediation does not create or modify any production image.

To roll back:

1. Open the `Deploy to Production` workflow in GitHub Actions.
2. Run `workflow_dispatch`.
3. Select `rollback`.
4. Enter the exact target image SHA, which must be a full SHA contained in `origin/main`, as `release_sha`.
5. Enter `ROLLBACK_PRODUCTION` as the confirmation.

The rollback job requires `nextshift-app:<release_sha>` to exist and verifies that its OCI revision label exactly matches `release_sha` before retagging it as `latest`, recreating the app service, and running `scripts/deploy-smoke.sh`. A missing, unlabeled, or mismatched image fails closed.
