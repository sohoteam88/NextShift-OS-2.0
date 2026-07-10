# E1A Environment Contract v1

Date: 2026-06-19
Status: READY FOR E2
Blocker: E1A-003 Environment Contract Cleanup

## Objective

Define one production environment contract and eliminate ambiguous or unsafe keys.

`.env.production.example` was updated to match this contract. Real `.env` values were not read or modified.

## Classification

| Key | Class | Notes |
| --- | --- | --- |
| `NODE_ENV` | required | Must be `production` in production |
| `NEXT_PUBLIC_APP_URL` | required | Public app origin |
| `NEXT_PUBLIC_BASE_DOMAIN` | required | Used by middleware/CORS/subdomain logic |
| `DATABASE_URL` | required | Prisma pooled/runtime connection |
| `DIRECT_URL` | required | Prisma direct/migration connection |
| `NEXT_PUBLIC_SUPABASE_URL` | required | Client-safe Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | required | Client-safe anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | required | Server-only, never public |
| `NEXTAUTH_SECRET` | required | Auth/session secret where NextAuth paths are used |
| `NEXTAUTH_URL` | required | Auth callback base URL |
| `OPENAI_API_KEY` | optional | AI provider |
| `ANTHROPIC_API_KEY` | optional | AI provider |
| `DEEPSEEK_API_KEY` | optional | AI provider |
| `GOOGLE_GENERATIVE_AI_API_KEY` | optional | Canonical Gemini provider key |
| `GEMINI_API_KEY` | deprecated | Backward-compatible alias only |
| `MINIMAX_API_KEY` | optional | AI provider |
| `WHATSAPP_API_TOKEN` | optional | WhatsApp integration |
| `WHATSAPP_PHONE_NUMBER_ID` | optional | WhatsApp integration |
| `RESEND_API_KEY` | optional | Email integration |
| `N8N_WEBHOOK_URL` | optional | Automation integration |
| `REDIS_URL` | optional | Required for distributed rate limiting when using Redis/Upstash |
| `REDIS_TOKEN` | optional | Required only for Upstash Redis adapter |
| `SENTRY_DSN` | optional | Error tracking sink, no vendor required by D3 |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional | Client analytics |
| `NEXT_PUBLIC_POSTHOG_HOST` | optional | Client analytics |
| `NEXT_PUBLIC_COMMIT_SHA` | optional | Build metadata |
| `NEXT_PUBLIC_BUILD_TIME` | optional | Build metadata |
| `NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6` | optional | Feature flag |
| `BILLPLZ_API_KEY` | optional | Server-only payment provider key |
| `BILLPLZ_COLLECTION_ID` | optional | Server-only payment config |
| `BILLPLZ_X_SIGNATURE_KEY` | optional | Server-only webhook signing secret |
| `BILLPLZ_SANDBOX` | optional | Explicit `false` in production |
| `BILLPLZ_CALLBACK_URL` | optional | Production callback base URL |
| `BILLPLZ_REDIRECT_URL` | optional | Production redirect URL |
| `STRIPE_SECRET_KEY` | optional | Server-only Stripe key |
| `STRIPE_WEBHOOK_SECRET` | optional | Server-only Stripe webhook secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | optional | Client-safe Stripe publishable key |
| `TEST_DATABASE_URL` | test-only | Never required in production |
| `E2E_AUTH_STATE` | test-only | E2E only |
| `E2E_FUNNEL_ID` | test-only | E2E only |
| `E2E_LEAD_ID` | test-only | E2E only |

## Decisions

1. `GOOGLE_GENERATIVE_AI_API_KEY` is canonical.
2. `GEMINI_API_KEY` remains deprecated fallback only.
3. No Billplz signing secret may use `NEXT_PUBLIC_`.
4. `BILLPLZ_X_SIGNATURE_KEY` is server-only.
5. Launch readiness now reads Billplz server-key status from the admin system-health API instead of checking public env names.

## Public Key Rule

Only values intentionally safe for browsers may use `NEXT_PUBLIC_`.

Never public:

- Service-role keys.
- Payment signing secrets.
- Webhook secrets.
- Database URLs.
- API tokens.
- Auth secrets.

## Final Decision

READY FOR E2
