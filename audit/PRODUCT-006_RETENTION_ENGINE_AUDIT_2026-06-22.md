# Retention Engine Audit (PRODUCT-006)

**Scope:** Independent audit of the Retention Engine against the PRODUCT-006 PRD.
**Method:** Verified from source, tests, and command output. Implementation claims not trusted.
**Date:** 2026-06-22
**Mode:** Read-only audit (no files modified)

## Verify checklist (1–12)

| # | Check | Result |
|---|---|---|
| 1 | Outcome-progression based, not login/session/time | ✅ Level/RETAINED/risk key off verified-outcome count + recency (`outcomeDaysInactive` ← `lastOutcomeAt`); score is 80% outcome-weighted; login/`daysInactive` retained only as PRD-sanctioned legacy/penalty |
| 2 | Retention levels correctly assigned (7) | ✅ `retentionLevelFor` assigns all 7 (NEW_SUCCESS/ACTIVE_PROGRESS/MOMENTUM/AT_RISK/STALLED/RETAINED/EXPANDING) |
| 3 | ≥2 verified outcomes before retained | ✅ RETAINED requires `outcomeCount >= 2`; EXPANDING requires `>= 4` |
| 4 | 14d without outcome progress → AT_RISK | ✅ `outcomeDaysInactive >= 14` → AT_RISK (outcome-based) |
| 5 | 30d without outcome progress → STALLED | ✅ `outcomeDaysInactive >= 30` → STALLED (checked before AT_RISK) |
| 6 | Outcome recommendation progression | ✅ `NEXT_OUTCOME`: FIRST_LEAD→FIRST_CUSTOMER→FIRST_REVENUE→RETENTION_SYSTEM→TEAM_SCALING→AUTHORITY_BUILDING |
| 7 | Recovery does not bypass AI COO | ✅ `recoveryFor`/`outcomeRecommendation` are localized descriptors (action + route `/mission`); no mission writes/override |
| 8 | Momentum Card displays user-language labels | ✅ `MomentumCard` uses `useTranslations('retention.dashboard')` + server-localized `retentionLevelLabel` |
| 9 | Localization Engine consumed | ✅ `localizationEngine.t`/`resolveLocale`; 18 `retention.*` keys (en/zh/ms); next-intl on the card |
| 10 | Personalization context respected | ✅ `nextOutcomeFor` consumes upstream `currentOutcome` context |
| 11 | Retention audit events deduped | ✅ `ensureRetentionAudit` → `writeAuditIfMissing` (findFirst dedupe) |
| 12 | Type-check + build pass | ✅ type-check exit 0; build exit 0 |

## Scores

- **Retention Compliance Score: 92 / 100** — outcome-based levels, ≥2-outcome retained threshold, 14/30-day outcome-recency risk, correct progression chain, AI-COO-respecting recovery, full localization, deduped audit, personalization context. Deductions for the dual (outcome + legacy-activity) model surface.
- **Outcome Progression Integrity: 9 / 10** — retention level, RETAINED status, and risk are all outcome-driven; ~80% of the retention score is outcome-weighted (count/velocity/recency/progress); progression chain matches the PRD. Deduction: `inactivityPenalty` + legacy `retentionState` remain activity-based (PRD-sanctioned backward-compat, but a dual concept).
- **Risk Detection Accuracy: 9 / 10** — 14d/30d thresholds measured from last verified outcome; `outcomeRetentionRiskFor` is outcome-primary with mission inactivity secondary; correct precedence (STALLED before AT_RISK before RETAINED-by-count). Minor: for `outcomeCount === 0` users, risk falls back to mission-inactivity (reasonable for pre-first-outcome).
- **Localization Coverage: 10 / 10** — all retention copy flows through `localizationEngine` (18 `retention.*` keys across en/zh/ms) with translation-source/fallback tracking in audit; the Momentum card renders via next-intl + the localized level label. Continues the PRODUCT-005 localization adoption.

## Must Fix
1. **[Low] Reduce the dual-retention surface.** The authoritative outcome-based `outcomeRetention.retentionLevel` coexists with the legacy activity-based `retentionState`, `inactivityPenalty`, and `signals.loginFrequency`. The PRD explicitly sanctions backward-compat, but clearly deprecate/label the legacy activity-based `retentionState` so future consumers key off the outcome-based level rather than the login signal.
2. **[Low] (carryover) Signal fidelity.** Outcome-count and revenue-derived retention depend on upstream signals being populated (the COO-002B signal-fidelity thread); confirm real outcome/revenue signals before relying on retention KPIs.

## Final Verdict: READY FOR NEXT PHASE

PRODUCT-006 makes retention genuinely outcome-based rather than a vanity-metric: the retention level, the RETAINED determination (≥2 verified outcomes), and the 14-/30-day risk windows all key off verified-outcome count and recency (`lastOutcomeAt`), the retention score is ~80% outcome-weighted, and the outcome-recommendation chain matches the PRD progression. Recovery is a localized recommendation that routes the user without bypassing the AI COO, the Dashboard Momentum Card renders user-language labels (next-intl + localized level label), the Localization Engine is fully consumed (18 `retention.*` keys, en/zh/ms), audit events dedupe, and personalization context is respected. Type-check and build pass; all twelve verification points hold. The login/session/time signals that remain are explicitly retained as backward-compat and do not drive the retained determination. The two open items are low-severity. Proceed to the next phase.

## Commands Run
- `git status --short`; retention/engagement/score/momentum reads + localization/dashboard greps — ✅ ran
- `vitest run retention-engine, dashboard-projection-adapter, expansion-engine, referral-engine` — ✅ 4 files, 16 passed
- `pnpm type-check` — ✅ exit 0, 0 errors
- `pnpm build` — ✅ exit 0, 0 hard errors
