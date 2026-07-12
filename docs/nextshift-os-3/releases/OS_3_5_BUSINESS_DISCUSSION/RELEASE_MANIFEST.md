# OS 3.5 Business Discussion Release Manifest

Version: 3.5 RC

Status: RC Package Prepared - Awaiting Approval

Last Updated: 2026-07-11

---

## Release Identity

| Field | Value |
| --- | --- |
| Release Name | OS 3.5 Business Discussion |
| Theme | Business Brain Starts Talking |
| Release Version | 3.5 RC |
| Release Package | `docs/nextshift-os-3/releases/OS_3_5_BUSINESS_DISCUSSION/` |
| Source Branch | `planning/os-3.3-runtime-platform` |
| Package Branch | `release/os-3.5-rc-package` |
| Release State | RC package prepared, awaiting approval |
| Tag Status | Prepared, not created |
| Recommended Tag | `v3.5.0` |

---

## Documentation Set

| Artifact | Purpose |
| --- | --- |
| [README](README.md) | Release package entry point |
| [Release Notes](RELEASE_NOTES.md) | User-facing release summary and known limitations |
| [Release Manifest](RELEASE_MANIFEST.md) | PR-by-PR scope and artifact registry |
| [Final Verification](FINAL_VERIFICATION.md) | Verification evidence and audit references |
| [Tag Preparation](TAG_PREPARATION.md) | Final tag preparation plan |

---

## Included PRs And Commits

The merge commits and delivery commits below were verified from git history on `planning/os-3.3-runtime-platform` on 2026-07-11.

| PR | Merge Commit | Delivery Commit(s) | Scope | Primary Deliverables |
| --- | --- | --- | --- | --- |
| #38 | `2452d69` | `6e1506f` | T1: AI router readiness | Router readiness audit, `AI_DAILY_CALL_LIMIT_PER_TENANT` tenant daily quota, OS 3.5 Blueprint drafted, OS 3.4 RC package docs, R-1 Sentry fallback fix carried in |
| #39 | `dc56391` | `402620f` | T2: Discussion service | `discussion-service.ts`, `POST /api/v1/dashboard/recommendation/discuss`, 5-turn cap, off-topic guard, `AI_DISCUSSION` flag (strict default OFF) |
| #40 | `9c5bef9` | `c5a5088` | T3: Discussion UI | Discussion panel on `TodayRecommendationCard`, availability probe, ARIA wiring |
| #41 | `a00dfc7` | `2574c74` | H-A: ESLint CLI migration | `eslint.config.mjs` flat config, `eslint-boundaries.config.mjs` generator, `.eslintrc.json` removed, authoritative baseline 409 boundary + 4 hooks |
| #42 | `8736f77` | `281a484`, `7f521ac`, `61b6975`, `b1b5abd` | H-B: Hygiene batch | `React.cache` on `getAuthUser`, `no-store` on health/version, obsolete compose `version` field removed, lint baseline doc update |
| #43 | `dc52431` | `df59913`, `8a3189a` | H-C: Card iteration | Recommendation card hierarchy refinement, confidence four-tier display, G-series time gate replaced by coverage gate |
| #44 | `42011ed` | `76777d1` | G1: Flag graduation | MISSION / BUSINESS_STATE / CRM / COMMAND_CENTER graduated to `isRuntimeFlagEnabledByDefault` |
| #45 | `f9285ee` | `e75794b`, `5d6bfca` | G2a: Revenue legacy removal | `isEnabled: () => true`, `runtime-revenue-flag.ts` deleted, behavior-equivalence baseline tests |
| #46 | `0cc79e3` | `d1040e4`, `4cad8bb` | G2b: Analytics legacy removal | `isEnabled: () => true`, `runtime-analytics-flag.ts` deleted, behavior-equivalence baseline tests |
| #47 | `f86c3fb` | `0ad34f5` | G3: Flag lifecycle field | `lifecycleStatus`/`graduatedAt` discriminated union on `RuntimeFlagDefinition` |

Audit record commit:

| Commit | Scope |
| --- | --- |
| `bf83e8a` | Round 5 code review report filed (PR #38-#47), Audit Result appended to OS 3.5 Blueprint, audit registry whitelist updated |

---

## Included Repository Artifacts

### Business Discussion

- Discussion service: `src/modules/dashboard/services/discussion-service.ts` (imports `getRouterForTenant`, `enforceQuota`, `logAIUsage` from `modules/ai`)
- Discussion API route: `src/app/api/v1/dashboard/recommendation/discuss/route.ts`
- Discussion panel UI: `src/modules/dashboard/components/TodayRecommendationCard.tsx`
- AI router: `src/modules/ai/router/`
- Tenant quota: `src/modules/ai/usage/quota.ts`
- Usage tracker: `src/modules/ai/usage/tracker.ts`

### Runtime Flag Lifecycle

- Runtime flag registry: `src/lib/runtime-flags.ts`
- Runtime flag lifecycle history: `docs/nextshift-os-3/runtime-standard/RUNTIME_FLAG_LIFECYCLE.md`
- Revenue Runtime Adapter (legacy removed): `src/modules/revenue-drivers/runtime/RevenueRuntimeAdapter.ts`
- Analytics Runtime Adapter (legacy removed): `src/modules/analytics/runtime/AnalyticsRuntimeAdapter.ts`

### Platform And Governance

- OS 3.5 Blueprint: [OS 3.5 Blueprint](../../OS_3_5_BLUEPRINT.md)
- Round 5 audit: [Round 5 Code Review Report](../../../../audit/OS35_R5_PR38_PR47_CODE_REVIEW_REPORT.md)
- ESLint boundary generator: `scripts/generate-eslint-boundaries.ts`

---

## Release Gates

| Gate | Status | Evidence |
| --- | --- | --- |
| Discussion flag ON renders "Discuss with AI" entry point | PASS | PR #40, `TodayRecommendationCard.tsx` discussion panel tests |
| All AI discussion traffic routes through `modules/ai` router | PASS | Round 5 CP1 — `discussion-service.ts` imports, no direct provider calls |
| Per-tenant daily quota enforced before router dispatch | PASS | Round 5 CP2 — `quota.test.ts` 6 cases, 429 propagation test |
| Four remaining flags graduated to default ON | PASS | PR #44, Round 5 CP3 |
| Revenue/Analytics legacy branches physically removed, zero residual references | PASS | PR #45/#46, Round 5 CP4 |
| Flag lifecycle field compile-time enforced | PASS | PR #47, Round 5 CP5 |
| ESLint CLI baseline 409 boundary + 4 hooks reproducible in CI | PASS (CI evidence) | PR #44-#47 GitHub Actions runs; Round 5 CP6 |
| Full validation (type-check/test/build/lint/E2E) green | PASS (CI evidence) | Round 5 CP7; PR #46 E2E 7m38s, PR #47 E2E 7m50s |
| Discussion panel UI iron rules (zero arbitrary values/hex, shared components) | PASS | Round 5 CP8 |
| Round 5 audit recorded | PASS | `audit/OS35_R5_PR38_PR47_CODE_REVIEW_REPORT.md`, commit `bf83e8a` |
| Release package prepared | PASS | This package |
| Tag creation | NOT CREATED | Prepared in [Tag Preparation](TAG_PREPARATION.md) |
| Production approval | NOT GRANTED | Steven approval required |

---

## Exclusions

- No tag created by this package task
- No production deployment by this package task
- No `src/`, `packages/`, CI, Prisma, or environment changes in this package task
- No new runtime module migration beyond the existing 5/68 coverage
- No production `.env.production` changes (Steven's manual step after `v3.5.0` deploy)
