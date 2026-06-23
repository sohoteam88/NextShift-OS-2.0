# Mission Generator V2 Audit (COO-005)

**Scope:** Independent audit of Mission Generator V2 against COO-005 PRD.
**Method:** Verified from source, tests, and command output. Implementation claims not trusted.
**Date:** 2026-06-22
**Mode:** Read-only audit (no files modified)

## Verify checklist (1–11)

| # | Check | Result |
|---|---|---|
| 1 | Every MissionType has a fixed template | ✅ `TEMPLATES: Record<MissionType, MissionTemplate>` — 11 templates, type-enforced (`MissionGeneratorV2.ts:22`) |
| 2 | Generator does not invent structure dynamically | ✅ `generateMissionPlan` selects `TEMPLATES[missionType]`; only parameterizes id/route/nextMilestone (`MissionGeneratorV2.ts:175-194`) |
| 3 | Every mission includes the 9 fields | ✅ `MissionPlan` + generator return objective/description/steps/estimatedTime/successCriteria/completionChecks/route/missionType/nextMilestone; steps carry id/title/description/estimatedMinutes/required |
| 4 | Completion validated by completionChecks, not button | ⚠️ Partial — `validateMissionCompletion` checks them, but wiring feeds all-or-nothing (`MissionEngineAuthorityService.ts:253`) |
| 5 | Dashboard displays plan, does not generate it | ✅ `AICommandCard` renders steps/currentStep/progress; adapter derives currentStep/progress from engine plan (`DashboardProjectionAdapter.ts:524-554`); no UI generation |
| 6 | MissionAuthority outputs missionPlan + missionCompletion | ✅ `MissionEngineAuthorityService.ts:280-281` |
| 7 | Audit stores generated plan + completion result | ✅ `DashboardProjectionAdapter.ts:309-312` (objective/steps/completionChecks/completionResult) |
| 8 | BUSINESS_HEALTHY → optimization mission | ✅ `OPTIMIZATION` template "Growth Optimization Mission"; tested (`mission-generator-v2.test.ts:69-96`) |
| 9 | NO_SYSTEM → signal recovery mission | ✅ `SYSTEM` template "Restore Business Visibility"; PriorityEngine updated to `NO_SYSTEM`→`SYSTEM` (`PriorityEngine.ts:263`); tested (`mission-generator-v2.test.ts:98-118`) |
| 10 | Tests cover all MissionTypes | ❌ Only 3 of 11 behaviorally tested (LEAD_MAGNET, OPTIMIZATION, SYSTEM) |
| 11 | Type-check + build pass | ✅ type-check exit 0 (0 errors); build exit 0 (0 hard errors) |

## Mission Generator Compliance Score: 85 / 100

Structurally excellent and COO-005-compliant; deductions for structural-only completion verification and thin behavioral test coverage.

## Execution Clarity Score: 8 / 10
Each mission plan has a clear objective, 3–4 concrete steps (title/description/time/required), success criteria, estimated time, route, and next milestone; the card renders the current step + step list + progress. Deduction: `MissionGeneratorV2` templates are **English-only** (objective/description/steps), so the rendered plan shows English step text under the zh card — inconsistent with HOTFIX-005's explainability localization.

## Completion Verification Score: 5 / 10
The framework is correct — `completionChecks` with all-must-pass, `validateMissionCompletion` is pure and tested (`mission-generator-v2.test.ts:120-143`). But the wiring (`MissionEngineAuthorityService.ts:253`) passes `completedChecks = actionMission.status === 'completed' ? plan.completionChecks : []` — so checks are evaluated **all-or-nothing from the journey mission status**, never individually against live business signals. Progress is therefore only 0% or 100%, and completion truth is still the journey status, not the declared checks. The checks are displayed and audited but not independently verified.

## Template Coverage
- **11 / 11 MissionTypes have templates** (`BRAND, POSITIONING, CONTENT, LEAD_MAGNET, FUNNEL, TRAFFIC, CUSTOMERS, RETENTION, TEAM, OPTIMIZATION, SYSTEM`), type-enforced via `Record<MissionType, …>`.
- **3 / 11 behaviorally tested.** Untested: BRAND, POSITIONING, CONTENT, FUNNEL, TRAFFIC, CUSTOMERS, RETENTION, TEAM. (`RETENTION` and `SYSTEM` are now reachable because PriorityEngine was updated to map `NO_RETENTION`→`RETENTION` and `NO_SYSTEM`→`SYSTEM`.)

## Duplicate Logic Findings
- **None in the mission generator** — it is the single template source; the adapter only *derives* currentStep/progress from the engine's plan (presentation, not generation).
- **Resolved upstream:** `ExplainabilityAuthority.ts` is gone (HOTFIX-006), so the COO-004 duplicate-explainability finding is fixed — explanation is now single-source (`ExplainabilityEngine`).
- **[Low] Sync risk (not a decision tree):** each template hardcodes `estimatedTime` in parallel with the sum of `step.estimatedMinutes` (currently consistent, e.g. LEAD_MAGNET 35 = 5+15+10+5); could drift.

## Must Fix
1. **[High] Evaluate completion checks against real signals.** `MissionEngineAuthorityService.ts:253` derives `completedChecks` all-or-nothing from `actionMission.status === 'completed'`, so declared checks (`leadMagnet.published`, `signals.available`, …) are never individually validated. Wire each completionCheck to business signals/state so completion answers COO-005's "How do we know it is complete?" with real per-check verification (and real intermediate progress).
2. **[Medium] Add behavioral tests for the 8 untested MissionTypes** (BRAND, POSITIONING, CONTENT, FUNNEL, TRAFFIC, CUSTOMERS, RETENTION, TEAM), asserting objective/steps/successCriteria/completionChecks.
3. **[Low] Localize the generator templates** (objective/description/steps) to zh/ms, consistent with HOTFIX-005.
4. **[Low] Derive `template.estimatedTime` from the step sum** (or add an equality assertion test) to prevent drift.

## Final Verdict: PASS WITH CHANGES

Mission Generator V2 is structurally strong and meets the COO-005 acceptance criteria: every MissionType owns a static template (no dynamic structure invention), all nine plan fields plus structured steps are present, the snapshot exposes `missionPlan` + `missionCompletion`, the audit log stores the plan and completion result, the dashboard renders the plan (objective/steps/current-step/progress) without generating it, BUSINESS_HEALTHY produces an optimization mission and NO_SYSTEM produces a signal-recovery mission, and type-check/build are green. It is **not** clean-ready because completion verification is structural-only — completionChecks are wired all-or-nothing from journey status rather than evaluated against live signals (Must Fix #1) — and only 3 of 11 mission types are behaviorally tested (Must Fix #2). Close those two and this is READY FOR THE NEXT PHASE.

## Commands Run
- `git status --short` — ✅ ran
- impl/usage greps (MissionGeneratorV2, missionPlan/missionCompletion, MissionType, completion wiring) — ✅
- `vitest run mission-generator-v2, mission-engine-authority, dashboard-projection-adapter` — ✅ 3 files, 16 passed
- `pnpm type-check` — ✅ exit 0, 0 errors
- `pnpm build` — ✅ exit 0, 0 hard errors
