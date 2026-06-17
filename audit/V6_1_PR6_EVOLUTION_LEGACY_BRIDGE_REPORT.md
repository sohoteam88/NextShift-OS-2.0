# V6.1 PR-6 — Evolution Legacy Bridge Completion Report

Status: completed

## Scope

Implemented the compatibility bridge between the legacy evolution stack and the V6 projection stack without changing any consumer code.

## Files Changed

- `src/modules/user-evolution/hooks/useUserEvolution.ts`
- `src/modules/user-evolution/adapters/legacy-evolution-bridge.ts`
- `src/modules/evolution/hooks/use-evolution-projection.ts`

## What Changed

- `useUserEvolution()` now supports the V6 projection path behind `NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6`.
- A legacy bridge adapter maps `EvolutionSnapshot` back into the legacy return shape expected by existing consumers.
- `useEvolutionProjection()` was simplified into a pure projection hook so the bridge can depend on it without circular legacy dependencies.

## Compatibility Notes

- Consumer imports remain unchanged.
- Consumer return shape remains unchanged.
- No consumer files were modified.
- No persistence or migration logic was changed.

## Verification Matrix

### Flag OFF

`useUserEvolution -> legacy logic`

### Flag ON

`useUserEvolution -> legacy bridge -> useEvolutionProjection -> EvolutionProjection -> EvolutionAdapter -> EvolutionSnapshot`

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## Result

The evolution dependency boundary now switches at the hook layer while keeping all current consumers stable.
