# E1 Environment Variable Audit

Date: 2026-06-19
Status: WARN
Scope: Static environment contract audit. Real `.env` values were not printed or reviewed.

## Method

Environment keys were identified from:

- `process.env.*` references in code/scripts/config.
- `.env.production.example`.
- `.env.example`.
- Dockerfile build args.
- `docker-compose.prod.yml`.

No real secret values are included in this report.

## Required For Production Boot

| Variable | Status | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Documented | Required by Prisma runtime |
| `DIRECT_URL` | Documented | Required by Prisma direct connection/migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Documented | Required by Supabase client and Docker build args |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Documented | Required by Supabase client and Docker build args |
| `SUPABASE_SERVICE_ROLE_KEY` | Documented | Required by server-side privileged Supabase use |
| `NEXT_PUBLIC_APP_URL` | Documented | Required by app URL/callback context |
| `NEXTAUTH_SECRET` | Documented | Required where NextAuth secret path is used |
| `NEXTAUTH_URL` | Documented | Required where NextAuth URL path is used |
| `NODE_ENV` | Documented | Required for production behavior |

## AI Provider Variables

| Variable | Status | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | Documented | Production example includes it |
| `ANTHROPIC_API_KEY` | Documented | Production example includes it |
| `DEEPSEEK_API_KEY` | Documented | Production example includes it |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Documented in `.env.example` only | Code also references `GEMINI_API_KEY`; standardize naming |
| `GEMINI_API_KEY` | Used by code, not documented | Add alias/decision or remove usage |
| `MINIMAX_API_KEY` | Documented in `.env.example` only | E1 spec requests MINIMAX verification; add to production example if supported |

## Payment / Billing Variables

| Variable | Status | Notes |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Documented in `.env.example` only | E1 spec requests STRIPE verification; add to production example if enabled |
| `STRIPE_WEBHOOK_SECRET` | Documented in `.env.example` only | Add to production example if enabled |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Documented in `.env.example` only | Add to production example if enabled |
| `BILLPLZ_API_KEY` | Documented in `.env.example` only | Code references Billplz |
| `BILLPLZ_COLLECTION_ID` | Documented in `.env.example` only | Code references Billplz |
| `BILLPLZ_X_SIGNATURE_KEY` | Documented in `.env.example` only | Code references Billplz |
| `BILLPLZ_SANDBOX` | Documented in `.env.example` only | Production value must be explicit |
| `BILLPLZ_CALLBACK_URL` | Documented in `.env.example` only | Should be production URL |
| `BILLPLZ_REDIRECT_URL` | Documented in `.env.example` only | Should be production URL |
| `NEXT_PUBLIC_BILLPLZ_API_KEY` | Used by code, not documented | Public API key exposure needs review |
| `NEXT_PUBLIC_BILLPLZ_X_SIGNATURE_KEY` | Used by code, not documented | Public signature key exposure is a security concern; review urgently |

## Messaging / Integration Variables

| Variable | Status | Notes |
| --- | --- | --- |
| `RESEND_API_KEY` | Documented in `.env.example` only | E1 spec requests RESEND verification; add to production example if enabled |
| `WHATSAPP_API_TOKEN` | Documented in `.env.example` only | Optional integration |
| `WHATSAPP_PHONE_NUMBER_ID` | Documented in `.env.example` only | Optional integration |
| `N8N_WEBHOOK_URL` | Documented in `.env.example` only | Optional integration; production should not default to localhost |

## Redis / Rate Limit Variables

| Variable | Status | Notes |
| --- | --- | --- |
| `REDIS_URL` | Documented in `.env.example`, optional in production example | Compose provides local Redis; app rate-limit adapter also expects Upstash style config |
| `REDIS_TOKEN` | Used by code, not documented | Required for Upstash Redis adapter; not required for local Redis URL |

## Observability Variables

| Variable | Status | Notes |
| --- | --- | --- |
| `SENTRY_DSN` | Documented in `.env.example` only | D3 does not select vendor; keep optional |
| `NEXT_PUBLIC_POSTHOG_KEY` | Used by code, not documented | Optional analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | Used by code, not documented | Optional analytics |
| `NEXT_PUBLIC_COMMIT_SHA` | Docker build arg / used | Document as build metadata |
| `NEXT_PUBLIC_BUILD_TIME` | Docker build arg / used | Document as build metadata |

## Feature / Test Variables

| Variable | Status | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_BASE_DOMAIN` | Used by middleware/security, not documented | Required for production subdomain/CORS correctness |
| `NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6` | Used by code, not documented | Feature flag; document default |
| `TEST_DATABASE_URL` | Test-only | Do not set in production unless test runner explicitly needs it |
| `E2E_AUTH_STATE` | E2E-only | Not production |
| `E2E_FUNNEL_ID` | E2E-only | Not production |
| `E2E_LEAD_ID` | E2E-only | Not production |

## Drift Findings

1. `.env.production.example` is much smaller than the actual code env surface.
2. `.env.example` includes more integrations than production example.
3. `GEMINI_API_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY` both appear; standardization needed.
4. `NEXT_PUBLIC_BASE_DOMAIN` is used for security/CORS but not documented in examples.
5. `REDIS_TOKEN` is used by rate limiting but absent from examples.
6. `NEXT_PUBLIC_BILLPLZ_X_SIGNATURE_KEY` appears unsafe as a public variable and needs review.
7. STRIPE, RESEND, and MINIMAX are not represented consistently in production example.

## Recommendation

Before production readiness:

- Create one canonical production env contract.
- Mark each key as required, optional, deprecated, or test-only.
- Remove or rename ambiguous aliases.
- Ensure no secret is exposed through `NEXT_PUBLIC_*`.
- Keep `.env.production.example` aligned with code.

## Final Status

WARN
