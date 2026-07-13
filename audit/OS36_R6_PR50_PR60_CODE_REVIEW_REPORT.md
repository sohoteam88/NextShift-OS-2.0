# OS 3.6 Round 6 — Business Memory Wiring · PostHog · Overdue Hygiene · CI Docs-Skip (PR #50–#60)

| Field       | Value                                                                       |
| ----------- | --------------------------------------------------------------------------- |
| Review Type | Code-level Audit (not Release Audit)                                         |
| Review Date | 2026-07-12                                                                   |
| Reviewer    | Claude Code (Audit Engineer)                                                 |
| Repository  | sohoteam88/NextShift-OS-2.0                                                  |
| Branch      | `planning/os-3.3-runtime-platform` HEAD `db70620` (PR #60 merge commit)      |
| Baseline    | `v3.5.0` = `413de70`                                                         |
| PRs         | #50 Blueprint · #51 M0 PostHog · #52 H1/H2 admin · #53 H4 UI baseline · #54 M1/M2 memory wiring · #55 H3 rate-limit IP · #58 CI docs-skip · #59 M3 recommendation memory · #60 M4 storage eval |
| Diff        | 54 files, +1099 / −49                                                        |
| Verdict     | **PASS WITH CONDITION** (2 doc/CI-hygiene conditions; no code defects)       |

---

## Executive Summary

All ten checkpoints were exercised against real code, tests, the reproducible baseline script, and authoritative GitHub Actions CI results. **Every functional deliverable (M0–M4, H1–H4) is correctly implemented and verified.** Type-check, lint, boundaries, unit tests, build, and E2E are green. No correctness or security defect was found.

Two non-functional gaps warrant a **condition** before RC — both documentation / CI-hygiene, neither indicating broken behaviour:

1. **M0 is not marked complete in the blueprint** and its description is stale (reads as an open task; `analytics.init()` is in fact wired). The other 8 items carry `已完成` markers. → violates CP10.
2. **Two unit-test files (`business-context-tests.ts`, `journey-engine-tests.ts`) never run in CI** because their `-tests.ts` suffix does not match the vitest `*.test.ts` include glob. PR #59 added the discussion-attention scenario test into `business-context-tests.ts`, so that test is silently dead. CP3's requirement is still independently met by a *running* test in `dashboard-recommendation-service.test.ts`.

---

## CP1 — M0 PostHog wiring (PR #51)

**`analytics.init()` real call site:** `src/components/AnalyticsInit.tsx` calls `void analytics.init()` inside a `useEffect`, guarded by a module-level `analyticsInitRequested` flag (init-once). It is mounted in the root `src/app/layout.tsx:59` inside `NextIntlClientProvider`. ✓ Real, single call site.

**Graceful degradation when `NEXT_PUBLIC_POSTHOG_KEY` missing:** `getPostHog()` (`tracker.ts:11`) returns `null` when `window` is undefined, when the key is absent, or when the dynamic `import('posthog-js')` throws. `init()` early-returns on `!ph`; `identify`/`track` use optional chaining (`ph?.…`). No throw path. ✓

**4 new events — call sites all valid & guarded:**
| Event | Call site | Guard |
| --- | --- | --- |
| `recommendation_viewed` | `TodayRecommendationCard.tsx:484` | dedup via `viewedRecommendationIds` ref-set + `telemetryUserId` null-check |
| `recommendation_clicked` | `TodayRecommendationCard.tsx:543` | `telemetryUserId && data` |
| `discussion_turn_sent` | `TodayRecommendationCard.tsx:510` | `telemetryUserId && recommendationId` |
| `weekly_active` | `DashboardHome.tsx:91` | per-UTC-week `localStorage` dedup + try/catch, never blocks render |

**5 existing events — call site status (F-2):** Of the 5 pre-existing events, only **3** have live call sites: `user_signed_up` (`auth/register/route.ts:60`), `funnel_created` (`funnel/funnels/route.ts:29`), `ai_content_generated` (`content-service.ts:118`). `content_published` and `upgrade_clicked` have **no call sites** anywhere in `src/` — and none at baseline `413de70` either (their features are not yet built). The blueprint M0 (c) claim "确认现有 5 个事件的调用点仍然有效" is therefore imprecise: 3 of 5 are wired; 2 have never had call sites.

**Result: CP1 PASS** (init + 4 new events fully wired and guarded; see F-2 advisory on the 2 unwired legacy events).

---

## CP2 — M1/M2 discussion memory read/write (PR #54)

**Event contract (M1):** `BusinessContextMemory.ts:11-13` adds `DISCUSSION_STARTED` / `DISCUSSION_TURN_COMPLETED` / `DISCUSSION_ABANDONED` to the event-type union.

**Firing logic:** `recordDiscussionMemoryEvents` (`discussion-service.ts:309-353`) writes `DISCUSSION_STARTED` **only when `turnsUsed === 1`** and `DISCUSSION_TURN_COMPLETED` **every turn**, and is invoked *after* a successful `router.generate` + `logAIUsage` (line 152). `DISCUSSION_ABANDONED` is never triggered — matches "保留类型但未触发". ✓

**Non-blocking + Sentry-visible failures:**
- Read: `loadDiscussionMemory` (line 293) wraps `getBusinessContext` in try/catch; on failure logs `runtimeFallbackLogger.warn('[discussion-memory] continuing without business memory', …)` and returns `undefined` → discussion continues.
- Write: each `append` is individually try/caught; failure logs `'[discussion-memory] failed to record discussion event'` and continues.
- `runtimeFallbackLogger.warn` = `console.warn` **+ `Sentry.captureMessage(level:'warning')`** (verified). ✓ Sentry-visible.

**Summary injection, not raw dump:** `buildMemorySummary` (line 355) injects a bounded summary — `activityLevel/completionVelocity/consistency`, the **3** most recent activity titles, `recommendationResponse` + first **3** accepted/ignored IDs. No raw JSON event dump. ✓

**Test coverage (`dashboard-discussion-service.test.ts`, 9 tests, all pass):** STARTED(turn 1)+COMPLETED assertion; concise-summary assertion; **read-fail → continues + still records COMPLETED**; **write-fail → still returns reply**; **both-fail → reply + 3 fallback logs**; off-topic local refusal; TURNS_EXHAUSTED at 5; quota-429 passthrough.

**Result: CP2 PASS.**

---

## CP3 — M3 recommendation reads discussion memory (PR #59)

**`discussionAttentionFor()` logic** (`business-memory-projection.ts:67-90`): filters `DISCUSSION_TURN_COMPLETED` with a `referenceId`, takes the `RECENT_DISCUSSION_EVENTS_LIMIT = 30` most recent (events are sorted `occurredAt DESC` by the caller at line 106), tallies turns per `recommendationId`, returns the highest-count recommendation with `turnCount >= DISCUSSION_ATTENTION_THRESHOLD = 3`, else `null`. Correct. The signal surfaces into `recommendedFocus` via `recommendedFocusFor` (line 92-103).

**decision-brain untouched:** `git diff --stat 413de70 db70620 -- packages/` = **empty**. Zero changes to `packages/decision-brain` (or any package). ✓ The new engine logic lives in the `src/modules/business-context-memory` services and `src/lib/command-center-recommendation-context.ts`, consuming decision-brain via `@nextshift/decision-brain` without modifying it.

**Command Center wiring:** `loadCommandCenterRecommendationContext` loads memory in parallel with analytics/revenue (`command-center-recommendation-context.ts:69`); on failure → `runtimeFallbackLogger.warn('[command-center] continuing without business memory', …)` + returns an empty projection (line 90-114). `buildDecisionContext` adds a `command-center-business-memory` evidence item carrying `recommendedFocus` + first-3 `ignoredIds` (line 182-192); the engine appends that summary to the recommendation rationale (`recommendation-service.ts:98,114`); `fallbackRule` folds `memorySummary` into `explain` (line 272). ✓ focus + ignored IDs reach both engine evidence and rule-fallback explain.

**Scenario test proving discussion → recommendation output (running test):** `dashboard-recommendation-service.test.ts:177` "*makes three completed discussion turns observable in the next default-engine explanation*" builds a real projection from 3 `DISCUSSION_TURN_COMPLETED` events (`buildBusinessContextProjection`) and asserts `result.explain` contains `你最近多次讨论过《Convert the next qualified lead》…`. Also `:205` proves the rule-fallback path surfaces the same signal, and `:189` proves memory-loader failure degrades to empty memory with a Sentry-visible warning. These are `*.test.ts` files that **do** execute (confirmed in the 34-test local run).

> Note: an additional projection-level scenario test exists at `business-context-tests.ts:92`, but that file is excluded from the suite (see F-3). CP3 does not depend on it — the recommendation-service test above is authoritative.

**Result: CP3 PASS.**

---

## CP4 — M4 storage evaluation credibility (PR #60, no code change required)

Every factual claim in the M4 write-up was verified against source:

- **Query patterns (verified vs `business-memory-event-store.ts`):** `list()` filters `tenantId + actorId + targetType='business_memory'`, `orderBy createdAt DESC`, `take 100` (line 88-100). `appendOnce()` adds `action` + a 24 h `createdAt` window, `take 25` (line 66-86). ✓ Exactly as described.
- **Existing indexes (verified vs `prisma/schema.prisma` `AuditLog`):** `@@index([tenantId, createdAt])` and `@@index([actorId])` — precisely the two indexes M4 names, and its reasoning that neither carries `targetType` (so neither fully serves `list()`) is correct.
- **Volume math:** 1 `STARTED` + ≤5 `TURN_COMPLETED` = 6 events/session; 10 users × 5 active days × 2 sessions × 6 = **600/week ≈ 86/day**; 10× Stage-B ≈ 860/day. Arithmetic correct; assumptions conservative (max turns every session).
- **Re-eval triggers:** single-tenant hotspot (10k rows), global volume/write-rate (100k rows or 7×>10k/day), and real latency (p95 > 100 ms over 3 day-windows) — concrete, measurable, and cover the right dimensions.
- **Index recommendation:** the proposed partial index `… (tenant_id, actor_id, created_at DESC) WHERE target_type = 'business_memory'` directly matches the `list()` predicate + sort; deferring the second (dedup) index until profiled is sound.
- **Retention caveat:** correctly notes `audit_logs` serves other audit uses, so no deletion/move without confirming compliance retention.

**Result: CP4 PASS** — evaluation is trustworthy; deferring the index is justified.

---

## CP5 — H1/H2 admin role removal (PR #52)

**Code removals (all in-diff, replaced with valid roles):** `ADMIN_ROLES` (`auth-routing.ts`) and `INVITE_ROLES` (`invite-service.ts`) now `{operator, platform_admin[, leader]}`; the `Role` union and the `role as …` cast drop `admin`; all 8 `/admin/*` route guards go `['operator','platform_admin','admin']` → `['operator','platform_admin']`; `MembersSection` `isAdminRole`; the `platform-admin/users` role-tone branch; and every test fixture `role: 'admin'` → `role: 'operator'`.

**Whole-repo residual grep** (excluding i18n namespace + docs): the only remaining `'admin'` string literals are **not the role** — the `admin` **feature key** (`planDefinitions.ts`, `saas/types.ts`, `agent-registry.ts` requiredFeatures) and the reserved-slug `'admin'` (`tenant/utils/slug.ts`). The only `+` line containing `'admin'` in the whole diff is the H1 blueprint's SQL text `… WHERE role = 'admin' → 0 rows` (documentation, not code).

**Result: CP5 PASS** — no residual `admin` role reference in active code.

---

## CP6 — H3 rate-limit trusted IP (PR #55)

**Helper (`src/lib/request-ip.ts`):** in production trusts **only** `x-real-ip`; returns `'unknown'` when absent; falls back to the first `x-forwarded-for` entry **only when `NODE_ENV !== 'production'`**. This closes D-001 (forged `x-forwarded-for` can no longer set the rate-limit key in prod).

**All 5 rate-limit routes use it:** `auth/route.ts`, `public/funnel/[slug]/submit`, `public/funnel/[slug]/track`, `public/member/invite/[code]`, `tenant/check-slug` — each `const ip = getRequestIp(request.headers)`. `auth/route.ts` previously read `x-forwarded-for` directly (the vulnerable pattern). No direct `x-forwarded-for` read remains outside `request-ip.ts` (only a test sets the header).

**nginx config on record:** `deploy/nginx/nextshift-os.conf:12` → `proxy_set_header X-Real-IP $remote_addr;` (so prod IPs resolve and forged XFF is inert).

**Forged-header test passes:** `request-ip.test.ts` asserts a forged `x-forwarded-for` is ignored in favour of `x-real-ip` in production, `'unknown'` when the trusted header is absent, and the forwarded fallback only under non-prod. `rate-limiting.test.ts` "blocks excessive login attempts" still works via the test-env fallback.

**Result: CP6 PASS.**

---

## CP7 — H4 UI escape baseline reproducibility (PR #53)

`node scripts/measure-ui-escape-baseline.mjs` was run twice, independently:

```
arbitrary_classname_values=4260
custom_button_implementations=8
custom_card_implementations=42
```

Identical across both runs and exactly matching the blueprint's 4,260 / 8 / 42. The script is deterministic (recursive `src/` walk, regex counts, `src/components/ui/` excluded for the custom-component counts).

**Result: CP7 PASS** — numbers reproduce exactly.

---

## CP8 — CI docs-skip semantics (PR #58)

**`paths-ignore` on both `pull_request` and `push`:** `docs/**`, `audit/**`, `**/*.md`, `platform/status.md`. GitHub skips a run only when **every** changed file matches an ignore pattern; any non-doc file (e.g. `src/`, `package.json`, workflows) forces a full run. Semantics correct — no non-doc change can be mis-skipped.

**Proven by the team's own proof branches (GitHub Actions):**
- `test/os-3.6-ci-docs-only-proof` → **no CI runs** (correctly skipped).
- `test/os-3.6-ci-mixed-proof` → full CI ran, **success** 14m19s (mixed PR not skipped).

**No branch protection depends on these checks:** `gh api …/branches/planning%2Fos-3.3-runtime-platform/protection` and `…/branches/main/protection` both return **"Branch not protected" (404)**. So a skipped run cannot leave a required check pending / block a merge.

**Result: CP8 PASS.**

---

## CP9 — Full verification suite

| Check | Result | Evidence |
| --- | --- | --- |
| `type-check` | ✅ PASS | Local `tsc --noEmit` exit 0 |
| `lint` | ✅ PASS | Local `eslint .` → **0 errors**, 416 warnings (known boundary baseline; Round 5 was ~413); CI green |
| `lint:boundaries:check` | ✅ PASS | Local → `eslint-boundaries.config.mjs is in sync` |
| `test` | ✅ PASS | 34 targeted OS-3.6 tests pass locally; full suite green in CI PR #59 (see F-3) |
| `build` | ✅ PASS | CI PR #59 "Type Check + Lint + Build: success" |
| `E2E` | ✅ PASS | CI PR #59 "E2E Tests: success" (ran with secrets, both flag configs) |

Per the Round 5 approach, build/E2E and the full DB-backed test suite are witnessed by GitHub Actions. Crucially, **HEAD `db70620` differs from the last green-CI commit `4fb0e6d` (PR #59 merge) only by `docs/nextshift-os-3/OS_3_6_BLUEPRINT.md`** — the code at HEAD is byte-identical to the CI-validated tree, so PR #60's docs-only CI skip is correct and non-lossy.

**F-3 (test wiring):** `business-context-tests.ts` and `journey-engine-tests.ts` (5 tests total) are **not** collected by vitest — the config `include` is `src/**/*.test.ts(x)` and these use a `-tests.ts` suffix. Forcing them to run (scratch config) shows **2 files / 5 tests pass**, so the code is correct — but they never guard against regressions in CI, and PR #59's new discussion-attention test lives in the excluded `business-context-tests.ts`.

**Result: CP9 PASS** (green suite; F-3 is a coverage-wiring condition, not a failure).

---

## CP10 — Blueprint ↔ code consistency

M1–M4 and H1–H4 all carry `已完成（2026-07-12）` markers and their descriptions match the code (verified per-checkpoint above, including the M1 "started on turn 1 / completed each turn / ABANDONED unused", M2 summary-injection + Sentry fallback, M3 30-event/≥3-turn threshold, M4 evaluation).

**F-1 (the primary condition):** **M0 is the only workstream item with no completion marker**, and its description is stale — it still reads `analytics.init() 目前在整个代码库里没有任何调用点 … 补：(a)…(b)…(c)`, i.e. as an open task, even though M0 shipped in PR #51 (init wired via `AnalyticsInit`, the 4 new events added). This violates CP10's "M0–M4/H1–H4 全部标记完成且描述与实际代码一致，没有遗漏或过时的表述".

**Result: CP10 PASS WITH CONDITION** — one item (M0) unmarked + stale.

---

## Findings

| ID | Severity | Checkpoint | Finding |
| --- | --- | --- | --- |
| **F-1** | Condition (doc) | CP10 | M0 not marked `已完成` in the blueprint and its description is stale (reads as open; `analytics.init()` is wired). All other items marked/accurate. |
| **F-2** | Advisory (doc) | CP1 | M0 (c) "确认现有 5 个事件的调用点仍然有效" is imprecise: only 3 of 5 legacy events have call sites; `content_published` / `upgrade_clicked` have none (features not yet built) — also true at baseline, not a regression. |
| **F-3** | Condition (CI) | CP9/CP3 | `business-context-tests.ts` + `journey-engine-tests.ts` (5 tests) never run — `-tests.ts` ≠ vitest `*.test.ts` include glob. Tests pass when forced. PR #59's discussion-attention test is thereby dead (CP3 still covered by a running recommendation-service test). |
| A-1 | Advisory | CP2 | Off-topic discussion path returns a result (client fires `discussion_turn_sent`) but records no `DISCUSSION_TURN_COMPLETED` memory event — minor client-telemetry ↔ server-memory mismatch. Non-blocking. |
| A-2 | Advisory | CP6 | Blueprint H3 references the prod path `/etc/nginx/sites-enabled/nextshiftos.com`; the repo's checked-in config is `deploy/nginx/nextshift-os.conf`. Both set `X-Real-IP`; keep the two references aligned. |

---

## Conditions to clear before RC (documentation / CI hygiene — no code defect)

1. **[F-1] Update the M0 row** in `OS_3_6_BLUEPRINT.md`: mark it `已完成（2026-07-12）` (PR #51) and replace the "没有任何调用点 … 补：" text with the shipped reality (`analytics.init()` mounted in `AnalyticsInit`/`layout.tsx`; `recommendation_viewed`/`recommendation_clicked`/`discussion_turn_sent`/`weekly_active` added). While there, correct the "existing 5 events" phrasing to reflect that only 3 are wired (`content_published`/`upgrade_clicked` await their features — F-2).
2. **[F-3] Wire the excluded tests into CI**: rename `business-context-tests.ts` and `journey-engine-tests.ts` to `*.test.ts` (or broaden the vitest `include`), so their 5 passing tests actually run.

---

## Verdict

**PASS WITH CONDITION.**

All eight functional deliverables (M0–M4, H1–H4) are correctly implemented, tested, and green across type-check, lint, boundaries, unit tests, build, and E2E. No correctness or security defect was found; `packages/decision-brain` is untouched; the rate-limit IP fix, admin-role removal, memory read/write safety-net, and the M4 evaluation are all sound. The two conditions (F-1 blueprint M0 marker/description, F-3 excluded test files) are documentation and CI-wiring corrections that do not affect runtime behaviour and can be cleared as part of RC prep.
