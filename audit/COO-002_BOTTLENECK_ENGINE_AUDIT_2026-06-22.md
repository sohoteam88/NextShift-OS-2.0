# Bottleneck Engine Audit

**Scope:** Independent audit of the Bottleneck Engine against COO-002 / COO-002A. Prior implementation notes and claimed verification were not trusted; verified from PRDs, source, tests, and command output.
**Date:** 2026-06-22
**Mode:** Read-only audit (no files modified)

## Compliance Score

**Score: 83 / 100**

Basis: The engine is near-perfect on the core 002A contract — **all 13 matrix bottlenecks are implemented, every threshold matches the matrix exactly, severities match, the confidence formula matches, candidates are generated then ranked to a single winner, and signal failure returns `NO_SYSTEM`.** Mission Engine consumes `BottleneckResult`; bottleneck confidence is internal and not exposed to the dashboard. Points deducted for: one evidence-integrity bug (`NO_CONVERSION`), 8 of 13 bottlenecks untested, the internal signal table (`evidence`) being shipped in the dashboard projection, a residual state→bottleneck tree outside the engine, and a live-signal reader that stubs revenue/retention inputs.

## Missing Bottlenecks

- **None missing.** All 13 matrix bottlenecks are generated in `BottleneckEngine.resolveBottleneck` (`src/modules/mission-engine/services/BottleneckEngine.ts:251,269,289,309,324,338,357,378,394,407,424,439,457,474`) and the `MissionBottleneck` type (`src/modules/mission-engine/contracts/MissionAuthority.ts:18-32`).
- **Extraneous (not in 002A):** `NO_APPOINTMENTS` remains in the enum (`MissionAuthority.ts:28`) and `ExplainabilityAuthority.ts:68`. The engine never emits it; legacy residue only.
- **Per-bottleneck check (signal rule / severity / evidence / explainability source / downstream):** all 13 verified correct. Explainability for each comes from `BottleneckEngine` candidate text and is surfaced to the UI via `ExplainabilityAuthority.resolve` using `bottleneckResult.explainability` (`ExplainabilityAuthority.ts:109`); mission type/route/CTA come from `CanonicalMissionRegistry`.

## Threshold Drift

**No threshold drift found.** Every 002A rule matches the implementation:

| Bottleneck | 002A | Impl (BottleneckEngine.ts) | Match |
|---|---|---|---|
| NO_POSITIONING | `audiencePainCount<3` | `:302` `audiencePainCount < 3` | ✅ |
| NO_CONTENT | `<3 pillars, <5 drafts` | `:321` `<3 / <5` | ✅ |
| NO_AUDIENCE | `published≥5 & engagement 0, or audience 0` | `:335` | ✅ |
| NO_TRAFFIC | `activeSources=0 or traffic=0` | `:391` | ✅ |
| NO_LEADS | `traffic≥100 & leads=0; conv<1% & traffic≥100` | `:402-403` | ✅ |
| NO_CONVERSION | `leads≥20 & customers=0; close<2% & leads≥20` | `:419-420` | ✅ |
| NO_RETENTION | `customers≥3 & repeat=0; retention<20% & customers≥3` | `:452-453` | ✅ |
| NO_TEAM | `revenue>0 & sop<3; revenue>0 & agents=0 & team=0` | `:469-470` | ✅ |
| Severity weights | C=100/H=50/M=20 | `:73-77` | ✅ |
| Confidence | C=90/H=80/M=65/none=40 | `:215-220` | ✅ |

- **Single note (not drift):** `NO_BRAND` uses `personalStoryLength < 100` (`:284`). 002A says "personal story too short" with example `=42` but does **not** define the numeric threshold, so `100` is an unspecified implementation choice, not a contradiction.

## Duplicated Logic

- **Residual state→bottleneck tree outside the engine:** `BottleneckAuthority.resolveStateBottleneck` + `BOTTLENECK_BY_STATE` (`src/modules/mission-engine/services/BottleneckAuthority.ts:9-94`) still maps state→bottleneck. It is used (a) as the in-engine fallback `fallbackCandidate` (`BottleneckEngine.ts:233`), (b) as the Mission Engine degraded-path fallback (`MissionEngineAuthorityService.ts:126`), and (c) for `businessStageFor`/`toBusinessBottleneck`. This overlaps the engine's `STATE_RELEVANCE` (`BottleneckEngine.ts:79-88`). Different shapes/roles, but the same domain knowledge lives in two places — a forbidden "duplicate state-to-bottleneck decision tree outside the Bottleneck Engine."
- **Route/type/CTA:** correctly centralized in `CanonicalMissionRegistry` + `CANONICAL_ROUTES`; **no `route.includes`** and no old mappers (grep clean). ✅

## Test Gaps

- **8 of 13 bottlenecks untested** in `src/__tests__/services/bottleneck-engine.test.ts` (asserts only `NO_TRAFFIC`, `NO_LEADS`, `NO_CONVERSION`, `NO_RETENTION`, `NO_SYSTEM`). Missing: `NO_BRAND`, `NO_POSITIONING`, `NO_CONTENT`, `NO_AUDIENCE`, `NO_LEAD_MAGNET`, `NO_FUNNEL`, `NO_CUSTOMERS`, `NO_TEAM`.
- **Weak `NO_SYSTEM` (validationFailed) test** (`bottleneck-engine.test.ts:120-133`): asserts bottleneck/severity/confidence only — **does not assert evidence/explainability**, so it masks that this path emits `validationFailed=…` evidence rather than 002A's canonical `"Business signals unavailable."` (only `signalFailureResult` emits that, `BottleneckEngine.ts:249-257`).
- **No tie-breaker test:** the ranking tie-break is exercised only incidentally (NO_CONVERSION vs NO_CUSTOMERS via `STATE_RELEVANCE`) and never asserted.
- **Masked evidence bug:** the `NO_CONVERSION` test sets `customerCount:0`, so the hardcoded `'customerCount=0'` evidence (`BottleneckEngine.ts:426`) looks correct and the bug (below) escapes.

## Must Fix

1. **[High] Cover the 8 untested matrix bottlenecks** and strengthen assertions to include `severity`, `confidence`, `evidence`, and `explainability` (esp. assert the `validationFailed` evidence so the NO_SYSTEM divergence is visible).
2. **[Medium] Fix `NO_CONVERSION` evidence integrity** (`BottleneckEngine.ts:426`): `'customerCount=0'` is hardcoded, so when the rule fires via the `closeRate < 2` branch with `customerCount > 0`, the evidence is false. Interpolate `${signals.customerCount}`. (Forbidden pattern: "evidence arrays that do not prove the selected bottleneck.")
3. **[Medium] Stop shipping the internal signal table to the dashboard:** `missionEngine.evidence` is in the `DashboardProjection` payload (`src/modules/dashboard/adapters/DashboardProjectionAdapter.ts:67,514`). 002A: "Dashboard must not show … internal signal table." Drop `evidence` from the projection (keep it in the audit log).
4. **[Medium] Populate real revenue/retention signals** in `readBottleneckSignals` — `revenue:0` (`BottleneckEngine.ts:595`) makes `NO_TEAM` unreachable from live data, and `repeatPurchaseCount:0` (`:604`) makes `NO_RETENTION` fire on `customerCount≥3` alone. Wire real values or document as V2 (impacts the 85% accuracy target).
5. **[Medium] Consolidate `BottleneckAuthority`'s state→bottleneck logic** so the Bottleneck Engine is the sole bottleneck authority (scope `BottleneckAuthority` to stage-only, or have it delegate to the engine).
6. **[Low] Unify `NO_SYSTEM` evidence** so the in-band validation-failure path (`BottleneckEngine.ts:267-279`) emits 002A's canonical `"Business signals unavailable."`, or explicitly document the richer-evidence divergence.
7. **[Low] Implement 002A tie-breakers #3 (Current Journey stage) and #4 (Latest user action)** in `rankCandidates` (`BottleneckEngine.ts:203-213`) or document their omission. Also remove the dead `confidence=40` branch (unreachable — all candidates carry evidence) and the legacy `NO_APPOINTMENTS` enum value.

## Audit Questions

1. **Implements every 002A bottleneck?** ✅ All 13.
2. **Thresholds exactly aligned?** ✅ Yes (only `personalStoryLength<100` is unspecified by 002A, not a drift).
3. **Generates all matching candidates before ranking?** ✅ `resolveBottleneck` pushes every matching candidate, then `rankCandidates`.
4. **Returns only one winner?** ✅ `ranked[0]` (`BottleneckEngine.ts:487`).
5. **Confidence internal only?** ✅ Not in `missionControl`/`missionEngine` confidence fields.
6. **Dashboard not showing bottleneck confidence?** ✅ Only `aiDecision.confidence` (separate concept) present; not rendered.
7. **Signal failure returns `NO_SYSTEM`?** ✅ Both the in-band and exception paths (evidence differs — see Must Fix #6).
8. **Mission Engine consumes `BottleneckResult`?** ✅ `MissionEngineAuthorityService.ts:197-201`; ⚠️ degraded path (no business state) uses `BottleneckAuthority` fallback.
9. **Duplicated bottleneck decision trees?** ⚠️ Residual `BottleneckAuthority` state→bottleneck tree (Must Fix #5).
10. **Tests cover every matrix bottleneck?** ❌ 5 of 13 (Test Gaps).

## Final Verdict

**Pass With Changes.**

The Bottleneck Engine faithfully implements the COO-002A matrix — all 13 bottlenecks, exact thresholds, correct severities and confidence, deterministic candidate generation, single-winner ranking, internal-only confidence, and PRD-compliant `NO_SYSTEM` failure — and the Mission Engine consumes its `BottleneckResult`. It cannot pass cleanly because (1) the `NO_CONVERSION` evidence can be factually wrong, (2) 8 of 13 bottlenecks have no test coverage, (3) the internal signal table leaks into the dashboard projection, and (4) live revenue/retention signals are stubbed, undermining real-world accuracy. None are happy-path correctness breaks, so these are changes rather than a failure.

## Commands Run

- `git status --short` — ✅ ran (only route-canonicalization + audit-doc changes; engine files untracked/new)
- `grep -RIn "route\.includes|bottleneckForBusinessState|toCanonicalBottleneck|missionReasonFor|decisionReasonFor|hasInternalReason" src/modules/{mission-engine,dashboard,business-state}` — ✅ **NONE**
- `grep -RIn "confidence" src/modules/dashboard` — ✅ only `aiDecision.confidence` + fallback literals; **no bottleneck confidence**
- `grep -RIn "NO_*" src/modules/mission-engine src/__tests__/services/bottleneck-engine.test.ts` — ✅ engine emits all 13; test asserts 5
- `vitest run bottleneck-engine, mission-engine-authority, dashboard-projection-adapter, ai-coo-decision-engine` — ✅ **4 files, 20 passed**
- `pnpm type-check` — ✅ **exit 0, 0 errors**
- *(prior run, same tree)* full `vitest run` — ⚠️ 163 passed / 44 skipped, **1 DB-integration file failed** (`mission-engine.test.ts`, `PrismaClientInitializationError` — no `DATABASE_URL`, environment-only, not a regression)
- *(prior run, same tree)* `pnpm build` — ✅ **exit 0** (0 compile/type errors, 244 pages)
