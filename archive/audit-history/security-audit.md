# E2 Security Audit

Date: 2026-06-19
Status: NOT READY FOR E3
Scope: Static security audit plus local security test execution. No deployment, production change, or secret rotation was performed.

## Executive Decision

NextShift OS is not ready for E3.

The security foundation is materially better than early production baseline: auth uses Supabase `getUser()` plus database user lookup, security headers exist, many API routes use `requireAuthApi`, tenant isolation tests exist, and E1A removed public Billplz secret checks. However, E2 found one production blocker and several high-priority gaps:

- P0/P1 role guard bug on admin routes using legacy `owner/admin` roles.
- P1 Billplz webhook signature verification returns `true` as a placeholder.
- P2 rate limiting covers only a small subset of expensive AI/generation routes.
- P2 several routes parse raw JSON without schema validation.
- P2 audit integrity is architecture-defined but not technically append-only.
- P2 isolation tests were skipped locally because `TEST_DATABASE_URL` was not configured.

## Verification Performed

Commands:

```bash
pnpm vitest run src/__tests__/security/*.test.ts src/__tests__/isolation/*.test.ts
```

Result:

```text
Test Files  5 passed | 6 skipped (11)
Tests       23 passed | 20 skipped (43)
```

Notes:

- Security tests passed.
- Isolation tests were skipped without `TEST_DATABASE_URL`; this is not enough production assurance for tenant isolation.

## Area Results

| Area | Result | Rationale |
| --- | --- | --- |
| Authentication | PASS | `requireAuthApi()` uses Supabase `getUser()` and DB lookup; pending/suspended users rejected. |
| Authorization | FAIL | `/api/v1/admin-command` and `/api/v1/admin/override` use legacy roles `owner/admin`, causing `requireRoleApi()` to allow any known role. |
| Tenant Isolation | WARN | Tenant-scoped services and tests exist, but isolation suite skipped locally; admin-command global reads are exposed by the authz bug. |
| Secrets | WARN | E1A fixed public Billplz env usage; service-role key remains server-only; webhook signing secret is not actually verified. |
| Rate Limiting | WARN | Auth/public funnel/content generation are limited; most expensive generate routes are not. |
| Input Validation | WARN | Many APIs use Zod, but some brand-builder and AI routes still cast raw JSON. |
| Headers | PASS | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy are applied. |
| Audit Integrity | WARN | D4/E1A policy exists, but append-only enforcement and cascade mitigation are policy-only. |
| AI Safety | WARN | Prompt sanitization exists; many generation routes lack rate limits; no systematic prompt leakage tests. |
| Production Surface | FAIL | Admin-command and manual override routes are reachable by any authenticated active user due role mismatch. |

## Authentication

Result: PASS

Evidence:

- `getAuthUser()` calls Supabase `auth.getUser()`.
- Authorization data is loaded from the database user row, not from user-editable JWT metadata.
- `requireAuthApi()` rejects unauthenticated, pending, and suspended users.
- Security tests cover unauthenticated, expired, pending, and suspended cases.

Residual risks:

- Password reset flow was not deeply verified in this audit.
- Sensitive operations do not validate Supabase session freshness beyond `getUser()`.

## Authorization

Result: FAIL

Finding:

`requireRoleApi()` defines this hierarchy:

```ts
platform_admin: 100
operator: 80
leader: 60
member: 40
```

But these routes pass legacy roles:

- `src/app/api/v1/admin-command/route.ts`
- `src/app/api/v1/admin/override/route.ts`

They call:

```ts
requireRoleApi(user, ['owner', 'admin'])
```

Unknown roles map to `0`, so `minLevel` becomes `0`. Any authenticated active user with `member` level `40` passes.

Impact:

- Non-admin users can potentially access global admin overview.
- Non-admin users can potentially read/apply/revoke manual SaaS overrides.
- This is privilege escalation and production-blocking.

Severity: P0/P1

## Tenant Isolation

Result: WARN

Strengths:

- CRM lead routes use authenticated user tenant context.
- Lead isolation tests cover cross-tenant list/read/create/update/delete behavior.
- AI isolation tests cover cross-tenant template and usage behavior.
- User isolation tests cover cross-tenant user list/role changes/team tree.

Risks:

- Isolation tests were skipped locally because `TEST_DATABASE_URL` was not configured.
- Admin-command service performs global reads and is exposed by the authorization blocker.
- Payment webhook scans all users' metadata by payment ID; this is server-side, but depends on webhook authenticity.

Severity: P0 if exploited through authz blocker; otherwise P2 until DB-backed isolation tests run.

## Secrets

Result: WARN

Strengths:

- No current `NEXT_PUBLIC_BILLPLZ_*` secret usage was found after E1A.
- `SUPABASE_SERVICE_ROLE_KEY` is only used in server-side code.
- Observability redaction policy exists.

Risks:

- Billplz webhook verification has a placeholder signature verifier returning `true`.
- Real `.env` values were not audited by E2 scope.

## Rate Limiting

Result: WARN

Rate-limited routes found:

- `/api/v1/auth`
- `/api/v1/public/funnel/[slug]/track`
- `/api/v1/public/funnel/[slug]/submit`
- `/api/v1/ai/generate/content`

Generate routes without observed `checkRateLimit()` include:

- `/api/v1/ai/generate/content-plan`
- `/api/v1/ai/generate/content/stream`
- `/api/v1/ai/generate/image`
- `/api/v1/ai/generate/lead-analysis`
- `/api/v1/ai/generate/whatsapp-reply`
- `/api/v1/ai/generate/world-class-funnel`
- `/api/v1/brand-builder/*/generate`
- `/api/v1/content-engine/generate`
- `/api/v1/funnel-builder/generate`
- `/api/v1/traffic-engine/generate`
- `/api/v1/video-production/generate`
- `/api/v1/webinar-center/generate`
- `/api/v1/whatsapp-ai/generate`

Impact:

- Tenant/user abuse of AI spend is possible.
- In-memory fallback is not distributed unless Redis/Upstash is configured correctly.

Severity: P2

## Input Validation

Result: WARN

Strengths:

- Many APIs use Zod schemas.
- Security tests cover lead validation, oversized payload guard, phone validation, and prompt injection sanitization.

Risks:

- Several brand-builder routes cast `await request.json()` directly to TypeScript types.
- Some routes do not use payload size guards.

Severity: P2

## Headers

Result: PASS

Evidence:

- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy`
- `Content-Security-Policy`
- `Permissions-Policy`

Security tests passed.

## Audit Integrity

Result: WARN

Strengths:

- D4 audit architecture exists.
- E1A ADR-023 chooses soft-delete tenants only.
- Audit page and `AuditLog` model exist.

Risks:

- `AuditLog.tenant` still has `onDelete: Cascade`.
- Append-only audit service is not implemented.
- Test cleanup hard-deletes audit rows, which is acceptable only in test DBs.

Severity: P2

## AI Safety

Result: WARN

Strengths:

- `sanitizePromptVariable()` filters common instruction-overwrite phrases.
- AI output validation blocks some unrealistic claims.
- D2 telemetry redacts prompt/conversation fields.

Risks:

- Prompt injection testing is limited.
- Many AI generation routes lack rate limiting.
- User-created AI templates can include arbitrary system prompts for allowed users.
- No broad cross-tenant prompt leakage suite ran locally.

Severity: P2

## Production Surface

Result: FAIL

High-risk routes:

- `/api/v1/admin-command`
- `/api/v1/admin/override`

Additional routes to review before E3:

- `/api/v1/auth/fix-uid`
- `/api/v1/ai/router/preview`
- `/api/payments/billplz/webhook`

## Final Decision

NOT READY FOR E3
