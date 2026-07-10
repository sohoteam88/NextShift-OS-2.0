# COO-002 Readiness — Architecture & Coupling Audit

**Scope:** Architecture / coupling / maintainability / technical-debt audit of the AI COO dashboard projection path, to determine readiness for the COO-002 Bottleneck Engine.
**Audited against:** DASH-001, DASH-003, COO-001, COO-001A, COO-001B (all present in `docs/ai-coo/`).
**Note:** COO-002 PRD is **not** in the repository.
**Date:** 2026-06-22
**Mode:** Read-only audit (no code edited)

---

## Δ Since the previous audit (2026-06-21)

Three findings from the prior Dashboard Zero audit are now **fixed**:

1. **Reasoning/label logic moved out of React.** `DashboardHome.tsx` is now presentation-only; the decision trees were relocated into the projection layer.
2. **Routes match COO-001A canonical contract.** `teamWorkforceMission` now routes to `/team/growth` (`MissionEngineAuthorityService.ts:189`); journey routes use `/content-engine`, `/funnel`, `/traffic-engine`, `/lead-magnet`, `/team/growth`.
3. **Traceability added.** `recordMissionDecisionAudit` writes `AuditLog` action `mission.decision.projected` (`DashboardProjectionAdapter.ts:329-357`), satisfying COO-001B traceability.

The three previously-missing PRDs (DASH-001, COO-001A, COO-001B) now exist in `docs/ai-coo/`.

---

## The 10 Checks

### 1. Is Dashboard presentation-only? — ✅ YES
`DashboardHome.tsx:62-99` maps `data.missionControl.*`, `data.value`, and `data.progressPath` to props only. No business-state / bottleneck / mission / route calculation. Satisfies the DASH-001 Product Rule.
**Micro-nit:** `routeOrFallback` (`DashboardHome.tsx:10-12`) makes a `/journey` fallback decision in the component — a trivial route choice DASH-001 would prefer in the projection layer.

### 2. Is mission reasoning generated only once? — ❌ NO
Reasoning is generated in **three** places and the last one wins:
- `reasoningFor` (`MissionEngineAuthorityService.ts:151-171`) → `explainability.reasoning`.
- `aiDecision.decisionReason` from the AI-COO plan (`ai-coo-decision-engine.ts`).
- `missionReasonFor` / `decisionReasonFor` (`DashboardProjectionAdapter.ts:233-286`) **override** both whenever `hasInternalReason()` matches — which is always true, because the engine string contains "Business State resolved"/"Current gap:".

The engine's reasoning is effectively **dead for the UI** (`missionEngine.reasoning` carries it but no component reads it). Violates DASH-001 Acceptance ("Mission reasoning is generated once by the backend projection path") and the spirit of COO-001B Explainability Rules 1 and 4.

### 3. Is validation deterministic? — ✅ YES
`business-state-capability-engine.ts:181-217` is pure and requirement-driven; no AI. Facts come from DB counts + `completedChecks` (`BusinessStateAssembler.ts:106-181`). Matches COO-001B (hardens the projection path, introduces no new engine).

### 4. Does Business State own state resolution? — 🟡 MOSTLY
`currentState` / `completedStates` / `missingRequirements` are owned by the capability engine. **But** state *interpretation* (state → bottleneck) lives in the **mission** module (`bottleneckForBusinessState`, `MissionEngineAuthorityService.ts:98-122`), with competing fallback resolvers (`businessStageFor`, `bottleneckFor`, lines 62-96) and `dashboardBusinessStateFor` (`adapter:359-380`). State *value* is owned by business-state; state *interpretation* is split across modules.

### 5. Does Mission Engine depend on Business State? — ✅ YES
`getCurrentMission` awaits `businessStateService.getBusinessState` first and passes `stateResult` into resolution (`MissionEngineAuthorityService.ts:259-263`). Correct hard dependency.

### 6. Can Dashboard function if Business State is unavailable? — 🟡 DEGRADES SAFELY, NOT INDEPENDENTLY
- If `getBusinessState` throws, the whole `Promise.all` (`adapter:383-400`) rejects → API error → `MissionEngineFailure` card with a `/journey` escape (COO-001B-compliant; no fabricated mission).
- If `stateResult` is merely null, engine + adapter fall back to journey-derived stage/bottleneck.
- **Weakness:** all-or-nothing — a single engine failure collapses the entire dashboard; Journey and Momentum cannot render independently. Spec-compliant, architecturally brittle.

### 7. Are there duplicated decision trees? — ❌ YES (significant)
- **State → bottleneck in 3 places:** `bottleneckForBusinessState`, `bottleneckFor` (`MissionEngineAuthorityService.ts:81-122`), `toCanonicalBottleneck` (`BusinessStateAssembler.ts:80-104`).
- **Stage derivation duplicated:** `businessStageFor` (mission → stage) vs capability engine `STATE_ORDER`.
- **Reasoning generators ×2-3** (see #2).
- **Parallel AI-COO decision system:** `focus-prioritizer.ts` (`focusForJourney` / `focusForDomain` stage trees), `risk-detector.ts`, `opportunity-detector.ts` produce `aiDecision`, largely shadowed by the adapter override.

### 8. Are there hidden route mappings? — ❌ YES
Route inferred by `string.includes` in multiple spots: `missionTypeFor` (`MissionEngineAuthorityService.ts:124-136`), `primaryActionLabel` (`adapter:297-314`), and `quickAccessFor` hardcodes `/ai-workforce`, `/analytics` (`adapter:171-183`). These now live in the projection layer (so COO-001A's UI rule is honored), but route-string branching is implicit mapping that can drift from the COO-001A canonical table.

### 9. Is there business logic inside UI components? — ✅ LARGELY RESOLVED
The major violation (reasoning trees in React) is gone. Residual view-logic only: `buildJourneySteps` (status filter/merge, `JourneyProgressCard.tsx:25-72`) and `hasBusinessData` filtering (`MomentumCard.tsx:11-25`). These are presentation derivations, not the five forbidden calculations.

### 10. Does the implementation fully support COO-002 Bottleneck Engine? — ❌ NO
COO-002 PRD is absent, and DASH-001 / COO-001B explicitly declare "no new Bottleneck Engine" as the *current* non-goal. Bottleneck logic is scattered across 3 derivations + 2 reasoning generators. A clean enum (`MissionBottleneck`) and a usable seam (`bottleneckForBusinessState`) exist, but adding a dedicated engine now would stack a 4th tree on 3 existing ones rather than consolidate them.

---

## Coupling Evidence: redundant fan-out

Per dashboard load, the same authorities are resolved multiple times with no request-scoped memoization:

- `getDashboardProjection` calls `businessStateService.getBusinessState` (`adapter:384`), `missionEngineAuthorityService.getCurrentMission` (`adapter:386`), and `cooPlanService.getCOOPlan` (`adapter:387`).
- `missionEngineAuthorityService.getCurrentMission` calls `getBusinessState` again (`MissionEngineAuthorityService.ts:260`).
- `ai-coo-decision-engine` (behind `getCOOPlan`) calls **both** `getBusinessState` and `getCurrentMission` again (`ai-coo-decision-engine.ts:33,35`).

Net: `getBusinessState` ≈ 3×, `getCurrentMission` ≈ 2× per load.

---

## Scores

| Dimension | Score | Basis |
|---|---|---|
| **Architecture** | **8 / 10** | Correct layering (deterministic state → mission → projection → presentation-only UI); DASH-001 source-of-truth honored. Deductions: reasoning owned in 2-3 layers; bottleneck interpretation sits in mission-engine, not a dedicated authority. |
| **Coupling** *(10 = loosest)* | **6 / 10** | `getBusinessState` ~3× / `getCurrentMission` ~2× per load with no memoization; all-or-nothing `Promise.all`; adapter coupled to full bottleneck enum + bilingual copy. |
| **Maintainability** | **7 / 10** | Typed contracts, single dashboard entry, deterministic engine, tests + audit logging. But a new business state requires coordinated edits across ≥5 decision trees and 2 reasoning maps. |
| **Technical Debt** *(10 = minimal debt)* | **6 / 10** | Duplicated decision trees, dead engine-reasoning path, shadowed AI-COO decision output, redundant fan-out fetching, hidden route string-matching. |

> Not verified in this read-only audit: `pnpm type-check` / `next build` (COO-001B's "build and type-check pass" acceptance). Confirm in CI before COO-002.

---

## Classification: **NOT READY for COO-002**

The architecture is close and the layering is sound, but introducing a Bottleneck Engine on top of today's three parallel bottleneck derivations and dual reasoning generators would **compound** duplication, not resolve it. COO-002 should be preceded by a short consolidation sprint.

### Gate to flip to Ready
See `COO-002_READINESS_GATE_CHECKLIST.md`. Summary:

1. Single bottleneck authority — collapse `bottleneckForBusinessState` + `bottleneckFor` + `toCanonicalBottleneck` into one function (the future COO-002 seam).
2. One reasoning source — Mission/Explainability layer emits the final normalized, localized reasoning; delete `missionReasonFor` / `decisionReasonFor` from the adapter.
3. De-duplicate fan-out — request-scope/memoize `getBusinessState` and `getCurrentMission`.
4. Replace route string-matching with the COO-001A canonical route/type map as a single lookup.
5. (Resilience) isolate Business State failure so Journey/Momentum still render.

---

## Files Inspected

- `src/modules/dashboard/components/DashboardHome.tsx`
- `src/modules/dashboard/adapters/DashboardProjectionAdapter.ts`
- `src/modules/dashboard/components/{JourneyProgressCard,MomentumCard,AICommandCard}.tsx`
- `src/modules/mission-engine/services/MissionEngineAuthorityService.ts`
- `src/modules/mission-engine/contracts/MissionAuthority.ts`
- `src/modules/business-state/services/{BusinessStateService,business-state-capability-engine}.ts`
- `src/modules/business-state/adapters/BusinessStateAssembler.ts`
- `src/modules/ai-coo/services/{ai-coo-decision-engine,focus-prioritizer,opportunity-detector,COOPlanService}.ts`
- `src/modules/journey-engine/journey-state-machine.ts`
- `docs/ai-coo/{DASH-001_AI_COO_FIRST_DASHBOARD_PHILOSOPHY,COO-001A_STATE_REQUIREMENTS_MATRIX,COO-001B_STATE_VALIDATION_ENGINE_PRD}.md`
- `audit/{DASH-003_AI_COO_MISSION_ENGINE_PRD,COO-001_BUSINESS_STATE_ENGINE_PRD}.md`
