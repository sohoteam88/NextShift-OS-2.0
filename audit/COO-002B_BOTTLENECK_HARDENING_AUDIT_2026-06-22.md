# Bottleneck Engine Audit — Post COO-002B Hardening

**Scope:** Independent audit of the Bottleneck Engine after the COO-002B hardening sprint, against COO-002 / COO-002A / COO-002B.
**Method:** Verified from source, tests, and command output. Implementation claims not trusted.
**Date:** 2026-06-22
**Mode:** Read-only audit (no files modified)

## Verification of the 13 sprint items

| # | Item | Result |
|---|---|---|
| 1 | All 13 bottlenecks implemented | ✅ Engine generates all 13; enum is exactly the 13 (`MissionAuthority.ts:18-31`) |
| 2 | All 13 bottlenecks tested | ✅ 14 tests cover all 13 + `signalFailureResult` (`bottleneck-engine.test.ts`) |
| 3 | Each test asserts bottleneck/severity/confidence/evidence/explainability | ✅ `expectBottleneck` asserts all 5 (`bottleneck-engine.test.ts:93-97`); NO_SYSTEM tests use `toMatchObject` with all 5 |
| 4 | NO_CONVERSION evidence uses real values | ✅ `customerCount=${signals.customerCount}` (`BottleneckEngine.ts:419`); test asserts `customerCount=1` (`bottleneck-engine.test.ts:200`) |
| 5 | revenue/retention/repeat/AOV/CLV real, not stubs | ✅ Computed from customer rows + metadata (`BottleneckEngine.ts:578-588`) — see R2 caveat |
| 6 | Dashboard hides evidence/confidence/signal tables/rankings | ✅ `missionEngine.evidence` removed; only `severity` exposed (`DashboardProjectionAdapter.ts:66,511`); bottleneck confidence not exposed — see R3 |
| 7 | BottleneckAuthority is a thin adapter | ✅ Only `businessStageFor` + `toBusinessBottleneck`; `resolve()`/`BOTTLENECK_BY_STATE` removed (`BottleneckAuthority.ts`) |
| 8 | NO_APPOINTMENTS fully removed | ✅ `grep NO_APPOINTMENTS src` → none |
| 9 | NO_SYSTEM failure path standardized | ✅ In-band (`BottleneckEngine.ts:271`), mission-engine fallback (`MissionEngineAuthorityService.ts:107`), and catch (`BottleneckEngine.ts:668`) all use `signalFailureResult()` — see R1 |
| 10 | No duplicated bottleneck decision trees | ✅ Engine is sole decider; `STATE_RELEVANCE` is ranking weights, not a parallel tree |
| 11 | `pnpm type-check` passes | ✅ exit 0, 0 errors |
| 12 | `pnpm build` passes | ✅ exit 0, 0 hard errors, 244 pages |
| 13 | Coverage report exists | ✅ `coverage/` (index.html, coverage-final.json, clover.xml; includes `BottleneckEngine.ts`) |

All five prior-audit Must-Fix items are resolved: evidence integrity, live revenue/retention signals, single Bottleneck Authority, projection cleanup (no evidence leak), and full 13-bottleneck test coverage.

## Scores

- **Bottleneck Accuracy: 8 / 10** — all 13 rules implemented with exact 002A thresholds, severities, confidence, single-winner ranking. Loses points for a real misclassification (R1) and a retention false-positive risk (R2).
- **Signal Integrity: 7 / 10** — revenue/AOV/CLV/retention/repeat are now DB-derived (no longer stubbed), satisfying COO-002B §2. But repeat-purchase is *inferred* from duplicate customer-identity rows and revenue depends on `customer.metadata` fields existing (R2); `trafficTrend`/`leadGrowthRate` remain `0` (R4).
- **Evidence Integrity: 9 / 10** — every candidate interpolates live signal values; NO_CONVERSION fixed and tested with `customerCount>0`. Minor: the no-candidate `fallbackCandidate` emits a diagnostic evidence array rather than the §7 canonical string (R1).
- **Architecture: 9 / 10** — single Bottleneck Authority, BottleneckAuthority demoted to stage adapter, NO_APPOINTMENTS gone, NO_SYSTEM standardized, Mission Engine consumes `BottleneckResult` only, projection cleaned, no duplicate trees, type-check + build green. Minor: `aiDecision.confidence` still in payload (R3); dead `confidence=40` branch (R5).

## Remaining Risks

- **R1 (Medium) — Healthy business is misreported as `NO_SYSTEM`.** With no failing signals, `resolveBottleneck` produces zero candidates → `fallbackCandidate` (`BottleneckEngine.ts:235,482`) returns `NO_SYSTEM` / High / 80 with explainability `"Business signals unavailable."`. A fully-completed business is therefore told its signals are unavailable. There is no "no-bottleneck / all-clear" terminal result, and this path is untested.
- **R2 (Medium) — Retention/repeat signal fidelity.** `repeatPurchaseCount` is inferred from duplicate customer identity rows (`BottleneckEngine.ts:579-584`); if customers are stored one row per person, it is always 0 → `retentionRate=0` → `NO_RETENTION` fires for *any* business with ≥3 customers. `revenue` relies on `customer.metadata.{revenue,amount,value,purchaseAmount}` being populated.
- **R3 (Low) — `aiDecision.confidence`** (AI-COO decision confidence, distinct from bottleneck confidence) is still in the dashboard projection payload (`DashboardProjectionAdapter.ts:106,545`); not rendered, but a strict reading of COO-002B §3 ("must not receive confidence").
- **R4 (Low) — `trafficTrend` / `leadGrowthRate` still stubbed to 0** (`BottleneckEngine.ts:631,634`); unused by any rule and not in §2's required list, but inconsistent with "live signals."
- **R5 (Low) — Dead `confidence=40` branch** (`BottleneckEngine.ts:219`): unreachable since every candidate carries evidence.

## Must Fix

1. **[Medium] Resolve the all-healthy case (R1):** add an explicit no-bottleneck/all-clear result (or make `fallbackCandidate` PRD-compliant per §7 and document that NO_SYSTEM ≠ "healthy"), and add a test for fully-healthy signals.
2. **[Medium] Harden retention/repeat derivation (R2):** measure repeat purchases from order/transaction data rather than duplicate customer rows, and guard `NO_RETENTION` against firing when repeat purchase is unmeasurable; verify revenue metadata is populated in production.
3. **[Low] Drop `aiDecision.confidence` from the projection** (R3) or document it as intentionally permitted (non-bottleneck).
4. **[Low] Remove the dead `confidence=40` branch and either wire or remove `trafficTrend`/`leadGrowthRate`** (R4, R5).

## Final Verdict: PASS WITH CHANGES

The COO-002B hardening sprint fully achieved its stated exit criteria: all 13 bottlenecks are implemented and tested with complete assertions, the NO_CONVERSION evidence bug is fixed, revenue/retention/AOV/CLV signals are now real, the dashboard projection no longer leaks evidence/confidence, `BottleneckAuthority` is a thin stage adapter, `NO_APPOINTMENTS` is gone, the `NO_SYSTEM` path is standardized, and type-check/build/coverage are all green. It is one short step from READY FOR COO-003 — but two genuine accuracy issues remain that the Priority Engine would inherit directly: a healthy business is misclassified as `NO_SYSTEM` (R1), and the retention signal can produce `NO_RETENTION` false positives (R2). Close those two and this is READY FOR COO-003.

## Commands Run

- `git status --short` — ✅ ran
- `grep -RIn "route\.includes|bottleneckForBusinessState|toCanonicalBottleneck|missionReasonFor|decisionReasonFor|hasInternalReason|NO_APPOINTMENTS" src/modules/{mission-engine,dashboard,business-state}` — ✅ NONE
- `grep -RIn "NO_APPOINTMENTS" src` — ✅ NONE
- `vitest run bottleneck-engine, mission-engine-authority, dashboard-projection-adapter, ai-coo-decision-engine` — ✅ 4 files, 28 passed
- `pnpm type-check` — ✅ exit 0, 0 errors
- `pnpm build` — ✅ exit 0, 0 hard errors, 244 pages
- coverage report — ✅ present (`coverage/`, generated 2026-06-22, includes `BottleneckEngine.ts`)
