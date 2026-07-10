# E2 Security Risk Register

Date: 2026-06-19
Status: NOT READY FOR E3

## Severity Model

| Severity | Meaning |
| --- | --- |
| P0 | Data breach, tenant isolation failure, auth bypass |
| P1 | Privilege escalation, secret exposure |
| P2 | Rate limiting, validation gaps |
| P3 | Best-practice issues |

## Risks

| ID | Severity | Area | Risk | Evidence | Required Action |
| --- | --- | --- | --- | --- | --- |
| E2-SEC-001 | P0/P1 | Authorization | Legacy `owner/admin` role checks allow any authenticated active user through `requireRoleApi()` | `/api/v1/admin-command`, `/api/v1/admin/override` | Replace allowed roles with `platform_admin` and/or `operator`; add regression tests |
| E2-SEC-002 | P1 | Secrets/Webhook | Billplz webhook signature verifier returns `true` placeholder | `src/app/api/payments/billplz/webhook/route.ts` | Implement HMAC verification using server-only `BILLPLZ_X_SIGNATURE_KEY` |
| E2-SEC-003 | P2 | Rate Limiting | Most AI/generation routes lack `checkRateLimit()` | Only auth, public funnel, content generation are limited | Add shared AI/generation rate-limit guard by user and tenant |
| E2-SEC-004 | P2 | Tenant Isolation | Isolation tests skipped without `TEST_DATABASE_URL` | Vitest result: 20 skipped | Run DB-backed isolation suite before E3 |
| E2-SEC-005 | P2 | Audit Integrity | Audit append-only and tenant soft-delete enforcement are policy-only | `AuditLog.tenant onDelete: Cascade`; ADR-023 | Implement audit writer and tenant delete guard or FK hardening |
| E2-SEC-006 | P2 | Input Validation | Some routes cast raw JSON instead of Zod validation | Brand-builder profile/interview/calendar routes | Add schemas and payload size guards to remaining JSON routes |
| E2-SEC-007 | P2 | AI Safety | Prompt injection and cross-tenant prompt leakage coverage is limited | Only one prompt sanitizer test | Add AI safety regression suite across templates, prompts, and generated content |
| E2-SEC-008 | P3 | CSP | CSP permits `'unsafe-inline'` scripts/styles | `src/lib/security.ts` | Consider nonce/hash CSP during frontend hardening |
| E2-SEC-009 | P3 | Session Security | Sensitive routes do not verify session freshness/session ID beyond Supabase `getUser()` | Auth middleware/service | Consider stricter session freshness for admin/security actions |

## Blocking Risks

E3 is blocked by:

1. E2-SEC-001
2. E2-SEC-002

Recommended before E3:

1. E2-SEC-003
2. E2-SEC-004

## Final Decision

NOT READY FOR E3
