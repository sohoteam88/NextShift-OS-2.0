# V6.1 PR-8B — UnlockPreview Migration Completion Report

Status: completed

## Scope

Migrated `UnlockPreview` from legacy evolution dependencies to the canonical `useEvolutionProjection()` contract.

## Files Changed

- `src/modules/experience/components/UnlockPreview.tsx`

## What Changed

- Replaced `useUserEvolution()` with `useEvolutionProjection()`.
- `UnlockPreview` now reads only projection fields needed for display:
  - `snapshot.level`
  - `snapshot.unlockedModules`
  - `snapshot.currentStage`
  - `snapshot.nextLevel`
- No layout, text hierarchy, icon set, spacing, or CTA structure was changed.

## Compatibility Notes

- `ENABLE_EVOLUTION_PROJECTION_V6=false` still preserves the same visible UI through the compatibility bridge.
- `ENABLE_EVOLUTION_PROJECTION_V6=true` now sources the same UI from the canonical projection stack.
- No Dashboard, Roadmap, Mission, Sidebar, CRM, Sales, Team, or Content migration was touched in this PR.

## Validation

- `pnpm type-check` passed
- `pnpm build` passed

## UI Verification

- Before screenshot: not captured in this session
- After screenshot: not captured in this session

## Result

`UnlockPreview` is now a canonical Evolution Projection consumer without changing the user-facing output.
