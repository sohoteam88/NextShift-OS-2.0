# Dashboard Zero — AI COO Audit Report

**Scope:** Product QA + UX Audit + System Integration Audit
**Subject:** `/dashboard` (Dashboard Zero V8) — AI COO, Journey Snapshot, Business Momentum
**Audited against:** DASH-002-REVISION-A, DASH-003_AI_COO_MISSION_ENGINE_PRD, COO-001_BUSINESS_STATE_ENGINE_PRD
**Date:** 2026-06-21
**Auditor mode:** No code edited (read-only audit)

---

## ⚠️ Document Availability (read-first step)

Of the 6 documents specified in the audit brief, only **3 exist** in the repository.

| Doc | Status |
|---|---|
| DASH-002-REVISION-A.md | ✅ `audit/DASH-002-REVISION-A.md` |
| DASH-003_AI_COO_MISSION_ENGINE_PRD.md | ✅ `audit/DASH-003_AI_COO_MISSION_ENGINE_PRD.md` |
| COO-001_BUSINESS_STATE_ENGINE_PRD.md | ✅ `audit/COO-001_BUSINESS_STATE_ENGINE_PRD.md` |
| DASH-001_AI_COO_FIRST_DASHBOARD_PHILOSOPHY.md | ❌ not in repo |
| COO-001A_STATE_REQUIREMENTS_MATRIX.md | ❌ not in repo |
| COO-001B_STATE_VALIDATION_ENGINE_PRD.md | ❌ not in repo |

The implementation was audited against the 3 available PRDs and the implemented capability/validation engine. The validation layer **cannot be fully certified** against COO-001B, and the requirement matrix **cannot be verified** against COO-001A — those source-of-truth specs are absent.

---

## 1. Dashboard Structure — ✅ PASS

`/dashboard` → `DashboardV4` → `DashboardHome`, rendering **exactly three** sections in order: AI COO, Journey Snapshot, Business Momentum.

- `src/modules/dashboard/components/DashboardHome.tsx:219-241` — renders `<AICommandCard>`, then `<JourneyProgressCard>` + `<MomentumCard>` only.
- Workforce / Recent Wins / analytics are **removed, not just hidden**. `WorkforceCard.tsx`, `RecentWinsCard.tsx`, `AICoachCard.tsx`, `MissionCoachHero.tsx`, `AiRecommendationPanel.tsx`, `TodaysActionCard.tsx` exist but have **zero JSX render sites** anywhere in `src` (only their own definitions). They are dead components.

## 2. AI COO Card — ✅ PASS

`src/modules/dashboard/components/AICommandCard.tsx`

- Exactly one mission (`todayMission`, lines 57-59).
- Explains *why this / why now / why not something else* (lines 62-91) — satisfies DASH-002 Rev 02 and DASH-003 Explainability Engine.
- Current stage available (`aiCommandCenter.currentStage`); current gap shown twice (lines 77-82, 146-151).
- Expected outcome shown (lines 154-167).
- **Confidence % removed**, replaced by Priority (Critical/High/Normal) — `priorityLabel` lines 27-31. No `confidence`/`92%` anywhere in dashboard components.
- Copy is conversational ("今天先做这一件事。" + paragraph reasoning) — meets DASH-002 Rev 10.

## 3. Business State Integration — ✅ PASS

- `currentState` comes from the Business State Engine: `BusinessStateService.getBusinessState` → `assembleBusinessState` → `resolveBusinessStateResult` (`BusinessStateAssembler.ts:194`).
- Dashboard does **not** calculate state — `DashboardProjectionAdapter.ts:266` consumes resolved `stateResult`; `DashboardHome` only reads `data.missionEngine.bottleneck` / `data.progressPath`.
- **readinessScore hidden** — exists in the contract (`BusinessStateResult.readinessScore`, `projection.readiness.value`) but rendered **nowhere** in the 3 cards.
- No-data fallback → `BRAND_FOUNDATION`: with all facts false, `resolveBusinessStateResult` returns the first incomplete state (`business-state-capability-engine.ts:181-203`). Matches COO-001. Engine never returns null/unknown.

## 4. Validation Engine Integration — 🟡 PASS WITH CHANGES

- Central deterministic layer exists: `business-state-capability-engine.ts`. `STATE_DEFINITIONS` declare per-state requirements; `requirementStatuses`/`isStateComplete` check them with pure booleans (lines 155-168). "Lowest incomplete capability wins" matches COO-001.
- **Deterministic:** facts are DB counts + `completedChecks` (`BusinessStateAssembler.readCapabilityFacts:106-181`); no AI in the validation path.
- **AI only for explanation:** validation is code; reasoning is template strings (`MissionEngineAuthorityService.reasoningFor:151-171`). No AI gates state.
- **Evidence on every validation:** `explainability.missing[]` (id/label/completed) plus a `reason` citing the first missing capability + success criteria (lines 197-202).
- ⚠️ **Cannot verify against COO-001B / COO-001A (both missing).** The implemented requirement set is plausible but un-sourced. Main reason this section is not a clean pass.

## 5. Mission Engine Integration — 🟡 PASS WITH CHANGES

- Mission Engine consumes validated state: `missionEngineAuthorityService.getCurrentMission` reads `businessState.stateResult` and derives stage + bottleneck from it (`MissionEngineAuthorityService.ts:259-263`, `bottleneckForBusinessState:98-122`).
- **Exactly one mission** generated/exposed (`dashboardCommandCenter`, lines 236-245; `recommendations.slice(0,1)`, adapter line 330).
- Start Mission routes to a real execution page — `executeRoute = data.aiCommandCenter.route` with `/journey` fallback (`DashboardHome.tsx:10-12, 204`). All journey mission routes resolve to existing pages: `/content-engine`, `/funnel`, `/traffic-engine`, `/lead-magnet`, `/brand-builder/step/*`, `/team/growth`, `/settings` (verified present).
- ⚠️ **Doc/code route drift:** DASH-003's mapping table (`CONTENT→/content`, `FUNNEL→/funnels`, `TRAFFIC→/traffic`, `TEAM→/team`) does **not** match implemented routes (`/content-engine`, `/funnel`, `/traffic-engine`, `/team/growth`). New-user route in DASH-003 says `/brand-builder/interview`; code uses `/brand-builder/step/interview` (exists; doc is stale). Functionally correct, spec is wrong.

## 6. Journey Snapshot — ✅ PASS

`JourneyProgressCard.tsx` / `buildJourneySteps`

- Shows only Completed / Current / Next, capped at 3 (`buildJourneySteps:25-71`, `.slice(0,3)`).
- Far-future locked stages hidden (last-2 completed merged + current + first next).
- Links to full Journey page (`href="/journey"`, lines 91-96).

## 7. Business Momentum — ✅ PASS

`MomentumCard.tsx`

- No wall-of-zeros: zero metrics filtered (line 25); full empty state when no data (`hasBusinessData`, lines 11-17, 51-67) — matches DASH-002 Rev 05.
- New-user empty state present ("No Business Data Yet" + Continue CTA).
- No scores/readiness — only outcome counts from `OutcomeMetrics` (content/views/leads/appointments/customers/revenue). No score fields on the type.

## 8. Error + Empty States — ✅ PASS

`DashboardHome.tsx`

- Mission failure state exists (`MissionEngineFailure`, lines 155-189) with **Retry** + **Open Journey** — matches DASH-002 Rev 08 / DASH-003.
- Loading shows a skeleton, not an infinite spinner (`DashboardHomeSkeleton`, lines 143-153).
- Momentum empty state exists (see §7).
- No blank-card path: AI COO empty `completedItems` falls back to "系统正在确认你的业务基础。" (`AICommandCard:127-131`).
- 🟡 Minor edge: empty `progressPath` renders the Journey card header/description with no step tiles. Low risk (journey engine always emits a path) but unhandled.

## 9. Mobile UX — ✅ PASS

- AI COO is first in DOM order.
- Start Mission button always rendered in the primary column (collapses above the aside on mobile — `lg:grid-cols-[1.35fr_0.65fr]`, `AICommandCard:47`).
- Exactly 3 homepage sections; secondary grid `lg:grid-cols-2`, single-column on mobile.
- Layout responsive throughout.

---

## 10. Final Verdict

| Score | Rating |
|---|---|
| **Product Compliance** | **9 / 10** |
| **UI Compliance** | **9 / 10** |
| **System Integration** | **8 / 10** |

### Must Fix

1. **Restore the 3 missing governing PRDs** (`DASH-001`, `COO-001A_STATE_REQUIREMENTS_MATRIX`, `COO-001B_STATE_VALIDATION_ENGINE_PRD`). Without them the validation engine and requirement matrix cannot be certified against an approved source of truth.
2. **Reconcile DASH-003 route mapping with reality.** The PRD's `Routing Engine` table is wrong (`/content`, `/funnels`, `/traffic`, `/team`, `/brand-builder/interview` are not the live routes). Update the PRD (or the routes) to match `/content-engine`, `/funnel`, `/traffic-engine`, `/team/growth`, `/brand-builder/step/interview`.

### Should Fix

3. **Explanation copy is regenerated in the frontend.** `DashboardHome.missionReasonFor` / `decisionReasonFor` (lines 58-113) override the engine's `reasoning` whenever it "looks internal" (`hasInternalReason`), keying polished copy off `bottleneck`. Per DASH-003 the Explainability Engine should own this; today localized rationale lives in the UI and can drift. Move localized explanation into the engine/projection layer.
4. **Harden the empty-`progressPath` case** in `JourneyProgressCard` (render a fallback tile instead of an empty grid).

### Nice To Have

5. `expectedOutcome` / `estimatedTime` occasionally surface raw English engine labels (`outcomeLabel` only maps a few values, `AICommandCard:115-122`) — extend the label map for full zh/en/ms consistency.
6. Delete the orphaned legacy cards (`WorkforceCard`, `RecentWinsCard`, `AICoachCard`, `MissionCoachHero`, `AiRecommendationPanel`, `TodaysActionCard`) to prevent accidental re-introduction.

### Files Inspected

- `src/app/(auth)/dashboard/page.tsx`
- `src/app/api/v1/dashboard/projection/route.ts`
- `src/modules/dashboard/components/{DashboardV4,DashboardHome,AICommandCard,JourneyProgressCard,MomentumCard}.tsx`
- `src/modules/dashboard/hooks/useDashboardMission.ts`
- `src/modules/dashboard/adapters/DashboardProjectionAdapter.ts`
- `src/modules/business-state/services/{BusinessStateService,business-state-capability-engine}.ts`
- `src/modules/business-state/adapters/BusinessStateAssembler.ts`
- `src/modules/business-state/contracts/BusinessStateResult.ts`
- `src/modules/mission-engine/services/MissionEngineAuthorityService.ts`
- `src/modules/journey-engine/journey-state-machine.ts`
- `src/modules/value/contracts/ValueProjection.ts`
- `audit/{DASH-002-REVISION-A,DASH-003_AI_COO_MISSION_ENGINE_PRD,COO-001_BUSINESS_STATE_ENGINE_PRD}.md`

### Final Verdict: **PASS WITH CHANGES**

The Dashboard Zero implementation is genuinely strong: one-mission AI COO with full why / why-now / why-not rationale, confidence removed, deterministic Business-State-first validation with evidence, readiness hidden, correct 3-section structure, robust error/empty states, and routes that resolve to real pages. It does **not** earn a clean Pass for one structural (not cosmetic) reason — **three of the six governing PRDs are missing from the repo**, so the validation engine and requirement matrix cannot be verified against an approved spec, and the one route contract that does exist (DASH-003) is out of sync with the code.
