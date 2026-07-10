# V6.1 PR-10B Sales Engine Migration Report

## Files Modified

- `src/modules/sales-engine/hooks/useSalesEngine.ts`

## Old Dependency Chain

- `useSalesEngine`
  - `useUserEvolution()`
  - `getUserLevel()`
  - `unlock-service`
  - `user-level-service`

## New Dependency Chain

- `useSalesEngine`
  - `useEvolutionProjection()`
  - `EvolutionProjection`
  - `EvolutionAdapter`
  - `EvolutionSnapshot`

## What Changed

- Replaced `useUserEvolution()` with `useEvolutionProjection()` inside the Sales engine hook.
- The hook now reads `snapshot.level` and keeps the same lock / visibility rules.
- Revenue and objection logic were left untouched.

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Explorer Verification

- Sales remains locked.

## Builder Verification

- Sales remains locked.

## Operator Verification

- `showFeatures = true`
- `showAdvanced = false`

## Leader Verification

- `showFeatures = true`
- `showAdvanced = true`

## Behaviour Preservation Result

- Sales behavior remains unchanged.
- `SalesDashboard` was not modified.
- Sales services, routes, and revenue logic were not modified.

## Screenshot Evidence

- Screenshot unavailable — browser surface unavailable.
- I did not have a live in-app browser surface available in this session to capture `/sales` before/after.

## Risk Assessment

- Risk level: MEDIUM
- Reason: the Sales engine is a user-facing lock gate, but only one hook was changed and downstream UI remained untouched.

## Rollback Verification

- Roll back `src/modules/sales-engine/hooks/useSalesEngine.ts` only.
- No persistence rollback is required.
