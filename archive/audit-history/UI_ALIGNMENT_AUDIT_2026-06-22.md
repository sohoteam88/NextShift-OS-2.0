# UI Alignment Audit

**Goal:** Verify the UI reflects the latest architecture (COO-001 → PRODUCT-009 engines).
**Method:** Component render-tracing + data-source inspection + dead-reference grep. Read-only.
**Date:** 2026-06-22

## Per-screen

### 1. Dashboard — Aligned (95)
- **Expected:** 3 sections only (AI COO, Journey Snapshot, Business Momentum), presentation-only (DASH-001).
- **Actual:** `dashboard/page → DashboardV4 → DashboardHome` renders exactly `AICommandCard` + `JourneyProgressCard` + `MomentumCard`. No state/bottleneck/route calc in components.
- **Missing:** none. **Legacy:** 3 unrendered files in the folder (see §9). **Must Fix:** none functional.

### 2. Journey — Partially Aligned (60)
- **Expected:** reflect mission-authority / OutcomeOrchestrator (same architecture as Dashboard/Workspace), user-locale aware.
- **Actual:** `/journey` renders `BeginnerJourneyView` off a **legacy** path (`useMissionState` + `JourneyCompletionResolver`), and passes **`locale="zh"` hardcoded**; the component uses its own `copy()` i18n, not the Localization Engine.
- **Missing:** outcome/mission-authority data path; locale resolution. **Legacy:** `JourneyCompletionResolver` path. **Must Fix:** realign data source + locale.

### 3. Mission Workspace — Aligned (95)
- **Expected:** plan steps, current step, progress, required/generated assets, agent panel, verification (EXEC-001/002/002A/005).
- **Actual:** `MissionExecutionWorkspaceClient` renders all of these + the Workforce panel; step-complete via `/complete-check` (whitelisted), verification is signal-based.
- **Missing/Legacy:** none. **Must Fix:** none.

### 4. Outcome View — Aligned (95)
- **Expected:** outcome progress, mission chain, current/next/blocked, required signal (EXEC-006).
- **Actual:** Outcome panel renders name/status/description, completion %, required signal + value, current/next mission, blocked count, mission chain.
- **Missing/Legacy:** none. **Must Fix:** none.

### 5. Momentum Card — Aligned (90)
- **Expected:** business momentum + retention/expansion/referral/health surfaced (PRODUCT-006/007/008/009).
- **Actual:** `MomentumCard` renders outcome metrics + retention level + expansion level + referral + customer health, via next-intl (`retention/expansion/health.dashboard`).
- **Missing:** none. **Legacy:** none. **Must Fix (Low):** card is information-dense — consider progressive disclosure.

### 6. AI COO — Mostly Aligned (80)
- **Expected:** single mission with why-this / why-now / why-not-others / expected outcome / next milestone, no confidence (DASH-001/COO-004).
- **Actual:** `AICommandCard` renders `missionControl` fields + priority + CTA; uses next-intl for some sub-labels. **But ~24 hardcoded zh strings remain** (section headers e.g. "今天先做这一件事", "为什么是这个").
- **Missing:** full locale resolution. **Legacy:** none (confidence already removed). **Must Fix:** localize the shell.

### 7. First User Experience — Partially Aligned (55)
- **Expected:** onboarding reflects the activation funnel + first-value model; UI consumes `FirstUserExperienceService` / `ActivationState`.
- **Actual:** an `/onboarding` wizard exists (goals/brand/first-funnel/first-content/profile/complete), but the pages do **not** consume `FirstUserExperienceService` or `ActivationState` — the service exists without a UI consumer wired in.
- **Missing:** FUX-state → onboarding wiring. **Legacy:** standalone wizard. **Must Fix:** wire (or document) the FUX service into onboarding.

### 8. Localization — Partially Aligned (65)
- **Expected:** all user-facing copy routes through the Localization Engine / next-intl per user locale (PRODUCT-003).
- **Actual:** **Data/projection layer fully localized** (retention/expansion/referral/health/success). **UI-shell layer inconsistent:** AICommandCard hardcodes zh; Journey hardcodes `locale="zh"` + own `copy()`.
- **Missing:** consistent shell-level locale resolution. **Must Fix:** see #1 below.

### 9. Dead Architecture References — Minor Drift (75)
- **Confirmed orphaned (truly unreferenced):** `BrandBuilderWidget.tsx`, `JourneyProgressMap.tsx`, `QuickLaunchGrid.tsx` (+ `JourneyProgress.tsx` superseded by `JourneyProgressCard`).
- **Clean:** no legacy routes (`/funnels`,`/content`,`/traffic`,`/team`), no `confidence%`/`readinessScore` in active components.
- **Must Fix (Low):** delete the dead files.

## Summary Scores

| Output | Score |
|---|---|
| **UI Alignment Score** | **78 / 100** |
| Dashboard Alignment | 95 / 100 |
| Mission Workspace Alignment | 95 / 100 |
| Outcome Alignment | 95 / 100 |
| AI COO Alignment | 80 / 100 |
| Localization Alignment | 65 / 100 |
| Legacy Architecture Drift | Minor (3–4 dead files; no legacy routes/concepts) |

## Must Fix (consolidated)
1. **[High] Localize the UI shells.** `AICommandCard` (~24 hardcoded zh strings) and the Journey screen (`locale="zh"` hardcoded + `BeginnerJourneyView.copy()`) must resolve the user's locale and route through next-intl / the Localization Engine — the engines below them are already fully localized, so this is the last mile of the localization thread.
2. **[Medium] Realign the Journey screen** off the legacy `useMissionState` + `JourneyCompletionResolver` path onto the mission-authority / OutcomeOrchestrator architecture used by Dashboard and Workspace.
3. **[Medium] Wire First User Experience.** Connect `/onboarding` to `FirstUserExperienceService` / `ActivationState` so onboarding reflects the activation funnel + first-value model (or document the intended decoupling).
4. **[Low] Delete dead dashboard components** (`BrandBuilderWidget`, `JourneyProgressMap`, `QuickLaunchGrid`, `JourneyProgress`).

## Final Verdict: PARTIALLY ALIGNED

The newest architecture is well-reflected where it matters most: the Dashboard (3-section, presentation-only), Mission Workspace, Outcome View, and Momentum Card are all strongly aligned (90–95), and the lifecycle suite (retention/expansion/referral/health) surfaces correctly with localized projection copy. The drift is concentrated in three places: the **Journey screen** still runs on a legacy completion path with a pinned `zh` locale; **localization is inconsistent at the UI-shell layer** (the AI COO card and Journey hardcode strings/locale even though PRODUCT-003 is fully built and adopted by every engine projection); and the **onboarding/FUX UI isn't wired to `FirstUserExperienceService`**. None of these are architectural regressions — they're trailing UI updates plus a few dead files. Close Must-Fix #1–#3 and this moves to FULLY ALIGNED.

## Commands Run
- Component render-tracing (`grep` JSX usage), orphan confirmation, Journey/onboarding/AICommandCard source reads, MomentumCard composite check, legacy-route/`confidence`/`readinessScore` greps — all ✅ (read-only; no type-check/build needed for an alignment review).
