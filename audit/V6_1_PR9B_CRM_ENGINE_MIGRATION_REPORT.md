# V6.1 PR-9B CRM Engine Migration Report

## Files Modified

- `src/modules/crm-engine/hooks/useCRMEngine.ts`

## Old Dependency Chain

- `useCRMEngine`
  - `useUserEvolution()`
  - `useMissionState()`
  - `getUserLevel()`
  - `unlock-service`
  - `user-level-service`

## New Dependency Chain

- `useCRMEngine`
  - `useEvolutionProjection()`
  - `EvolutionProjection`
  - `EvolutionAdapter`
  - `EvolutionSnapshot`

## What Changed

- Replaced `useUserEvolution()` with `useEvolutionProjection()` in the legacy CRM engine hook.
- CRM lock state now reads from `snapshot.level`.
- `showPipeline` and `showAdvanced` still resolve to the same visible states as before.
- The CRM engine lock reason text was preserved.

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Explorer Verification

- Explorer remains locked.
- Pipeline access remains hidden.
- Advanced CRM access remains hidden.
- Lock reason still renders.

## Builder Verification

- Builder remains locked under the existing CRM rules.
- Advanced CRM access remains hidden.
- Lock reason remains unchanged.

## Operator Verification

- CRM is unlocked.
- `showPipeline = true`
- `showAdvanced = false`

## Leader Verification

- CRM is unlocked.
- `showPipeline = true`
- `showAdvanced = true`

## Behaviour Preservation Result

- Legacy CRM engine behavior is preserved.
- `/crm-center` was not modified.
- CRM database logic, Prisma queries, and CRM services were not modified.

## Screenshot Evidence

- Screenshot unavailable — browser surface unavailable.
- I attempted to connect the in-app browser for `/customers` before/after capture, but the browser surface was not available in this session.

## Risk Assessment

- Risk level: MEDIUM
- Reason: the CRM engine is a user-facing lock gate, but only one hook was changed and the modern CRM center remained untouched.

## Rollback Verification

- Roll back `src/modules/crm-engine/hooks/useCRMEngine.ts` only.
- No persistence rollback is required.
