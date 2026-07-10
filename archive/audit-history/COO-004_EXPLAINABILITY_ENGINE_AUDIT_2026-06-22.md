# Explainability Engine Audit (COO-004)

**Scope:** Independent audit of the Explainability Engine against COO-004 PRD.
**Method:** Verified from source, tests, and command output. Implementation claims not trusted.
**Date:** 2026-06-22
**Mode:** Read-only audit (no files modified)

## Verify checklist (1–8)

| # | Check | Result |
|---|---|---|
| 1 | Every mission includes whyThis/whyNow/whyNotOthers/expectedOutcome/expectedRisk/nextMilestone | ✅ `ExplainabilityResult` + `MissionExplainability` carry all 6; `TEMPLATES: Record<MissionBottleneck,…>` type-enforces all 14; projection `missionControl` carries all 6 |
| 2 | Dashboard renders explanation, does not generate it | ✅ `AICommandCard` renders props only; `DashboardHome.tsx:82-85` maps from `missionControl`; no generation in UI |
| 3 | Engine doesn't expose scores / raw signals / impl terms | ✅ `TEMPLATES` are clean; `explainability-engine.test.ts:107-116` asserts no confidence/score, no `trafficCount=`, no "Bottleneck/Priority Engine" |
| 4 | BUSINESS_HEALTHY distinct optimization explanation | ✅ `ExplainabilityEngine.ts:104-110`; tested `:60-82` |
| 5 | NO_SYSTEM distinct recovery explanation | ✅ `ExplainabilityEngine.ts:111-117` (distinct from healthy); tested `:84-105` |
| 6 | Audit metadata stores all 6 fields | ✅ `DashboardProjectionAdapter.ts:300-305` (`mission.decision.projected`) |
| 7 | No duplicate explainability logic anywhere | ❌ See Duplicate Logic Findings |
| 8 | Type-check + build pass | ✅ type-check exit 0 (0 errors); build exit 0 (0 hard errors) |

## Explainability Compliance Score: 80 / 100

The engine is clean, complete, and COO-004-compliant; deductions for unconsolidated duplicate explanation generators (Q7), an English-body / Chinese-header language regression, and thin behavioral test coverage.

## Trust Layer Score: 8 / 10
Structured, complete six-part rationale (why this / now / not-others / risk / outcome / next milestone), fully audited, and free of internal scores or implementation jargon (verified by test). Loses points because the rendered rationale is generic English template text — not localized and not signal-personalized — which weakens trust for the zh-primary audience, and `expectedRisk` is generated but never surfaced.

## UI Clarity Score: 6 / 10
Clean card layout, well-labeled sections, correctly collapses Expected Risk per the PRD display rule. Major deduction: the card renders **English** `whyThis/whyNow/whyNotOthers` under **Chinese** headers (为什么是这个 / 为什么现在 / 为什么不是其他任务). `DashboardHome.tsx:82-84` maps the body to the engine's EN fields, and `ExplainabilityEngine.resolve` accepts a `locale` param (`ExplainabilityEngine.ts:146`) that is never used — templates are EN-only. Previously this copy was zh.

## Duplicate Logic Findings
- **[Medium] `ExplainabilityAuthority.copyFor`** (`ExplainabilityAuthority.ts:23-96`) is a second per-bottleneck explanation table (zh `reasoning`/`decisionReason`). It's now **dead for display and audit** — the card uses `whyThis/whyNow/whyNotOthers` (engine) and the audit stores the 6 engine fields — but it remains in the mission authority. COO-004 added the engine without retiring this generator.
- **[Low] BottleneckEngine per-candidate `explainability`** feeds `reasoning` (`ExplainabilityAuthority.ts:137`), a third explanation source; `reasoning` is now a dead `??` fallback in the card.
- **[Low] Adapter dead fallbacks** (`DashboardProjectionAdapter.ts:503-507`): `whyThis ?? missionReason`, `expectedRisk ?? 'Progress may slow…'` — presentation-side explanation copy that should not exist if the engine is the single source.

## Forbidden Exposure Findings
- **None in the rendered explanation.** Engine output excludes confidence/scores, raw signals (`trafficCount=`), and implementation terms — asserted by `explainability-engine.test.ts:107-116`. The card takes no `evidence`/`severity`/`confidence` props.
- **Note (pre-existing, non-explainability):** `aiDecision.confidence` (AI-COO decision confidence) is still in the projection payload (`DashboardProjectionAdapter.ts:546`); not explainability, not rendered.

## Must Fix
1. **[High] Localize the explanation output.** The AI COO card shows English body text under Chinese headers; `ExplainabilityEngine` ignores its `locale` param and ships EN-only templates. Add zh/ms templates (or wire `locale` end-to-end) so the rendered rationale matches the product's primary language.
2. **[Medium] Consolidate to one explanation source.** Make `ExplainabilityEngine` the single generator and delete `ExplainabilityAuthority.copyFor` + the `reasoning`-from-`bottleneckResult.explainability` path (or explicitly document why they remain). This is the Q7 failure.
3. **[Low] Remove dead adapter explanation fallbacks** (`DashboardProjectionAdapter.ts:503-507`) so the projection is a pure pass-through of engine output.
4. **[Low] Expand tests to all 14 bottleneck templates** (only NO_TRAFFIC, BUSINESS_HEALTHY, NO_SYSTEM are behaviorally tested), and either surface `expectedRisk` (collapsible) or drop it from the contract.

## Final Verdict: PASS WITH CHANGES

The Explainability Engine itself meets every COO-004 acceptance criterion: all six fields are present and type-enforced across 14 bottlenecks, the projection carries them, the audit log stores them, internal scores/raw signals/implementation terms are excluded (test-proven), BUSINESS_HEALTHY and NO_SYSTEM have distinct copy, and type-check/build are green. It is **not** clean-ready for COO-005 because Q7 fails — three parallel explanation generators still exist (`ExplainabilityAuthority.copyFor`, `BottleneckEngine.explainability`, the engine) with the legacy ones now dead-but-present — and a user-facing regression renders English explanation text under Chinese headers (the engine's `locale` is ignored). Fix the localization (Must Fix #1) and consolidate the duplicates (#2) and this is READY FOR COO-005.

## Commands Run
- `git status --short` — ✅ ran
- explainability impl/usage greps (`ExplainabilityAuthority`/`explainabilityEngine`/6 fields/`locale`) — ✅
- `vitest run explainability-engine, priority-engine, bottleneck-engine, mission-engine-authority, dashboard-projection-adapter` — ✅ 5 files, 51 passed
- `pnpm type-check` — ✅ exit 0, 0 errors
- `pnpm build` — ✅ exit 0, 0 hard errors
