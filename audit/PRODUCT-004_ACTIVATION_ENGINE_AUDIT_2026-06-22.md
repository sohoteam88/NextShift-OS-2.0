# Activation Engine Audit (PRODUCT-004)

**Scope:** Independent audit of the Activation Engine against the PRODUCT-004 PRD.
**Method:** Verified from source, tests, and command output. Implementation claims not trusted.
**Date:** 2026-06-22
**Mode:** Read-only audit (no files modified)

## Verify checklist (1–11)

| # | Check | Result |
|---|---|---|
| 1 | Activation funnel (SIGNUP→AI_INTERVIEW→BUSINESS_ANALYSIS→FIRST_MISSION→FIRST_ASSET→FIRST_OUTCOME→ACTIVATED) | ✅ `FUNNEL_DEFINITIONS` has exactly these 7, each with success signal + completion mapping |
| 2 | Activation state uses real signals, not UI flags | ✅ Sourced from `brandInterview`, `brandProfile`, `content`, `lead`, `funnel`, and audit events |
| 3 | First value defined and visible | ✅ `firstValueFor` → `{visible, type, label, achievedAt}`; dashboard shows current step/progress/next action |
| 4 | Drop-off detection (24h / 48h / 72h / outcome) | ⚠️ 48h mission + 72h asset-review correct; **24h interview is a no-op bug**; other stages not time-gated |
| 5 | Interventions generated but not spammy | 🟡 Count controlled (≤1/projection + audit dedupe), but timing premature (fires for in-progress users — see #4) |
| 6 | Activation audit events deduped | ✅ `writeActivationAuditIfMissing` dedupes by `targetType:activation` + targetId |
| 7 | FirstUserExperience consumes ActivationState | ✅ `FirstUserExperienceService.dashboardState` reads `activationState`/`firstValue`/`firstWin`/`kpis` |
| 8 | AI COO risk detector reads ActivationState | ✅ `risk-detector` emits `activation_${dropOffStage}` risk from `activationScore`/`activationRisk`/`currentStep` |
| 9 | Localization and personalization respected | ❌ Activation messages hardcoded (interventions EN, `currentMission` zh); no Localization Engine usage; asset personalization respected downstream (PRODUCT-002) |
| 10 | Activation score internal only | ✅ (with note) `activationScore` surfaced only as `completionPercentage`/progress (PRD-sanctioned "Progress: 57%"); no labeled "score" shown |
| 11 | Type-check + build pass | ✅ type-check exit 0; build exit 0 |

## Scores

- **Activation Compliance Score: 82 / 100** — correct 7-step funnel, real signal sourcing, visible first value, deduped audit, FUX + risk-detector integration, internal-only score. Deductions for the drop-off threshold bug, over-eager detection, and unlocalized activation messages.
- **First Value Clarity Score: 9 / 10** — `firstValue` is explicitly defined, typed, timestamped, and visibility-flagged; the activation dashboard surfaces current step, progress, and next action.
- **Signal Integrity Score: 9 / 10** — every funnel step derives from real DB signals/audit events, not UI-only flags. Minor: `FIRST_ASSET` falls back broadly through content/leadMagnet/landingPage.
- **Drop-off Detection Score: 5 / 10** — stages + risk tiers + 48h/72h gates exist, but the 24h interview gate is a no-op and most stages aren't time-gated, so drop-off conflates "in progress" with "stuck."

## Must Fix
1. **[Medium] Fix the 24h interview drop-off no-op.** `dropoff-detector.ts:20` is `… >= HOURS_24 ? 'interview_dropoff' : 'interview_dropoff'` — both branches identical, so interview drop-off fires at 0h instead of after 24h. Return a non-drop-off state before 24h.
2. **[Medium] Time-gate the remaining drop-off stages.** Only `first_mission` (48h) and `first_asset_review` (72h) have grace periods; `signup`/`brand_dna`/`content`/`lead_magnet`/`outcome`/`landing_page` fire immediately, so every non-activated user always carries a `dropOffStage` and a (premature) intervention. Add per-stage grace periods so "drop-off" means "stuck," matching the PRD.
3. **[Medium] Localize activation messages.** `interventionsFor` messages are hardcoded English and `currentMission` descriptions are hardcoded Chinese; neither uses the Localization Engine (PRODUCT-003). The PRD requires "all activation messages must use Localization Engine; activation language follows user locale." *(Recurring localization thread — PRODUCT-003 exists but activation doesn't consume it.)*

## Final Verdict: PASS WITH CHANGES

The Activation Engine's backbone is solid: the seven-step funnel is signal-sourced (not UI flags), first value is clearly defined and visible, the internal score is surfaced only as PRD-sanctioned progress, audit events are deduped, and both `FirstUserExperienceService` and the AI COO risk detector consume `ActivationState`. Type-check and build pass. It is **not** clean-ready because drop-off detection — a core purpose of this engine — has a real defect (the 24h interview threshold is a no-op) and is over-eager (most stages lack a grace period, so in-progress users are flagged and nudged prematurely), and because activation messages ignore the Localization Engine the program built in PRODUCT-003 (hardcoded EN interventions + zh mission copy), violating an explicit PRD rule. None are boundary failures, so these are changes rather than a block. Fix the drop-off time-gating (#1, #2) and wire localization (#3), then this is READY FOR PRODUCT-005.

## Commands Run
- `git status --short`; activation/FUX/risk-detector reads + localization grep — ✅ ran
- `vitest run activation-engine, first-user-experience, ai-coo-decision-engine` — ✅ 3 files, 12 passed
- `pnpm type-check` — ✅ exit 0, 0 errors
- `pnpm build` — ✅ exit 0, 0 hard errors
