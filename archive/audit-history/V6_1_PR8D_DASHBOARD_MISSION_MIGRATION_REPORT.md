# V6.1 PR-8D Dashboard Mission Migration Report

## Files Modified

- `src/modules/dashboard/hooks/useDashboardMission.ts`

## Old Dependency Chain

- `useDashboardMission`
  - `useMissionState`
  - `getUserLevel()`
  - `getCurrentMission()`
  - `getNextJourneyAction()`
  - `getAICoachAdvice()`

## New Dependency Chain

- `useDashboardMission`
  - `useMissionState`
  - `useEvolutionProjection()`
  - `getCurrentMission()`
  - `getNextJourneyAction()`
  - `getAICoachAdvice()`

## What Changed

- Removed `getUserLevel()` from the Dashboard mission hook.
- `userLevel` is now sourced from canonical `EvolutionSnapshot`.
- Mission selection still uses mission-state inputs, but the evolution level now comes from `useEvolutionProjection()`.
- Mission progress, CTA, and AI coach outputs were kept intact.

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Explorer Verification

- Verified the hook compiles with the explorer fallback path from `useEvolutionProjection()`.
- `currentMission` still resolves through the same mission-state checks.

## Builder Verification

- Verified `useDashboardMission()` still returns the same `nextAction`, `mission`, `progress`, and `aiCoachMessage` shape.

## Operator Verification

- Verified `userLevel.level` now comes from `EvolutionSnapshot` instead of `getUserLevel()`.
- Existing operator-stage mission resolution remains unchanged at the hook boundary.

## Leader Verification

- Verified the hook continues to pass the same leader-stage mission-state inputs into `getCurrentMission()`.
- No leader-specific UI consumer was migrated in this PR.

## Mission Behaviour Verification

- Dashboard mission card behavior stayed unchanged in code path and return shape.
- CTA labels, progress summary, and coach messaging still come from the same downstream helpers.

## Screenshot Evidence

- Not captured in this run.
- I attempted to connect the in-app browser for a live screenshot pass, but the browser surface was not available in this session.

## Risk Assessment

- Risk level: HIGH
- Reason: this hook feeds the Dashboard mission card and related CTA flow, so a regression would be user-visible immediately.

## Rollback Verification

- Roll back `src/modules/dashboard/hooks/useDashboardMission.ts` only.
- No mission authority, persistence, or DashboardV4 changes were made in this PR.
