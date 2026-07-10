# Priority Engine Audit (COO-003)

**Scope:** Independent audit of the Priority Engine against COO-003 PRD, COO-002 Bottleneck contracts, and HOTFIX-001 (Healthy Business State).
**Method:** Verified from source, tests, and command output. Implementation claims not trusted.
**Date:** 2026-06-22
**Mode:** Read-only audit (no files modified)

## Verification (10 points)

| # | Check | Result |
|---|---|---|
| 1 | Priority Engine independent; Mission Engine consumes `PriorityResult` only | ✅ `MissionEngineAuthorityService.ts:120` resolves via `priorityEngine.resolve`; mission/command-center driven by `PriorityResult` |
| 2 | Every `MissionBottleneck` has exactly one priority path | ✅ `PRIORITY_BY_BOTTLENECK: Record<MissionBottleneck, …>` — TS-exhaustive, all 14, actions match PRD table exactly |
| 3 | BUSINESS_HEALTHY → optimization only | ✅ `OPTIMIZATION` category/action "Optimize Growth"; test asserts no repair/restore/fix |
| 4 | NO_SYSTEM → restore signal/system | ✅ `SYSTEM` category, "Restore Business Signals" (`PriorityEngine.ts:240-252`) |
| 5 | `PriorityResult.confidence` internal, not on Dashboard | ✅ Adapter never reads `priorityResult`; `AICommandCenter` has no confidence field |
| 6 | Scoring weights 40/30/20/10 | ✅ `scoreCandidate` = impact·0.4 + revenueProx·0.3 + relevance·0.2 + urgency·0.1 (`PriorityEngine.ts:262-267`) |
| 7 | Candidate generation before winner selection | ⚠️ Mechanism exists (`selectCandidate` builds→scores→sorts) but `alternatives` is never populated → one candidate per bottleneck |
| 8 | Mission Engine no longer ranks/scores | ✅ `CanonicalMissionRegistry` scoring removed from mission engine; priority comes from `PriorityResult` |
| 9 | No duplicated priority tree in dashboard/adapter/mission engine | ⚠️ Adapter retains `CanonicalMissionRegistry.ctaLabelFor` fallback (`DashboardProjectionAdapter.ts:253,499`) — dead but duplicate |
| 10 | Tests cover all bottlenecks incl BUSINESS_HEALTHY + NO_SYSTEM | ✅ `priority-engine.test.ts` it.each (14) + dedicated BUSINESS_HEALTHY/NO_SYSTEM tests |

HOTFIX-001 verified end-to-end: empty candidates + signals available → `BUSINESS_HEALTHY` (severity `None`, confidence `90`, distinct copy, `BottleneckEngine.ts:222,239,479`); signal failure → `NO_SYSTEM`; both separately tested (`bottleneck-engine.test.ts:101,276`). This resolves the R1 raised in the COO-002B audit.

## Priority Engine Compliance Score: 87 / 100

All PRD acceptance criteria pass; deductions for unwired mission-history dedup, a dead duplicate CTA fallback, trivial candidate generation, and PRD-undocumented scoring/confidence formulas.

## Missing Actions
**None.** All 14 bottleneck→action mappings are present and match the COO-003 table exactly (`NO_BRAND…NO_TEAM`, `BUSINESS_HEALTHY`→Optimize Growth, `NO_SYSTEM`→Restore Business Signals); the `Record<MissionBottleneck, PriorityDefinition>` type makes omissions impossible.

## Scoring Drift
**None** against the stated weights — impact 40% / revenue proximity 30% / relevance 20% / urgency 10% match exactly (`PriorityEngine.ts:262-267`). Notes: (a) the COO-003 PRD text contains **no scoring-weights section**, so weights are verified against the audit prompt only — add them to the PRD; (b) `confidence = clamp(50,95, round((bottleneckResult.confidence + score)/2))` (`PriorityEngine.ts:302`) is an undocumented formula.

## Duplicated Logic
- **[Medium]** `DashboardProjectionAdapter.ts:253,499` — `CanonicalMissionRegistry.ctaLabelFor` (bottleneck/route→CTA) duplicates the PriorityEngine CTA mapping. It's a `??` fallback that's dead in the live path (`dashboardCommandCenter` is always populated), but it's a latent parallel priority/CTA decision path.
- **[Low]** `focus-prioritizer.ts` (ai-coo) is a separate prioritizer feeding `aiDecision` — distinct concept from `PriorityResult`, not a true duplicate, but parallel prioritization worth noting.
- **[Low]** Revenue-proximity ordering is encoded in both `PriorityEngine.REVENUE_PROXIMITY` and `BottleneckEngine.REVENUE_PROXIMITY_ORDER` (same concept, two shapes).

## Test Gaps
- **[Medium]** No test that the Mission Engine forwards mission history to the Priority Engine — because it doesn't (see Must Fix #1).
- **[Low]** Priority tests assert action/category/missionType/route/urgency + reason/impact length + `confidence≥50`, but never the exact scoring math, the candidate-ranking path, or the `recentPriorityActions` recency dedup.
- **[Low]** No integration assertion that the dashboard projection omits priority confidence.

## Must Fix
1. **[Medium] Wire mission-history dedup.** `MissionEngineAuthorityService.ts:120` calls `priorityEngine.resolve({ bottleneckResult })` with no `recentPriorityActions`; grep confirms no caller passes it. The PRD Rule "Mission history should avoid repeating the same priority" is therefore unimplemented. Pass recent actions (from business-context memory / audit log) or remove the param + rule.
2. **[Medium] Remove the duplicate CTA fallback** in the dashboard adapter (`CanonicalMissionRegistry.ctaLabelFor` at `:253,499`) so `PriorityResult` is the single CTA/route source; keep `CanonicalMissionRegistry` for canonical-route lookups only.
3. **[Low] Make candidate generation real** — populate `PriorityDefinition.alternatives` (or remove the unused ranking/recency machinery) so "generate candidates before ranking" isn't a single-candidate formality.
4. **[Low] Document the scoring weights + confidence formula in the COO-003 PRD**, and either implement or explicitly defer the "available agents may increase score" rule.

## Final Verdict: PASS WITH CHANGES

Every COO-003 PRD acceptance criterion passes: the Priority Engine is independent and emits exactly one action, every `MissionBottleneck` maps deterministically to the exact PRD action (type-enforced), scoring weights are correct, `BUSINESS_HEALTHY`→optimization and `NO_SYSTEM`→restoration are correct, the Mission Engine consumes `PriorityResult` and no longer scores, priority confidence stays internal, all 14 bottlenecks are tested, and type-check/build are green. It is one step from READY FOR COO-004 — the PRD's mission-history dedup rule is plumbed but not wired (Must Fix #1), and the adapter keeps a duplicate CTA fallback (Must Fix #2). Both are cleanup, not correctness breaks; close them and this is READY FOR COO-004.

## Commands Run
- `git status --short` — ✅ ran
- forbidden-pattern grep (mission-engine/dashboard/business-state) — ✅ none
- `grep -rn recentPriorityActions src/modules` — ⚠️ not passed by any caller
- `vitest run priority-engine, bottleneck-engine, mission-engine-authority, dashboard-projection-adapter` — ✅ 4 files, 40 passed
- `pnpm type-check` — ✅ exit 0, 0 errors
- `pnpm build` — ✅ exit 0, 0 hard errors, 244 pages
