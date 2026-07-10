# V6.1 PR-4 Clarification

## 1. Actual dependency graph

`useEvolutionProjection()`
↓
`useUserEvolution()`
↓
`getUserLevel()`
↓
legacy evolution logic
↓
`EvolutionSnapshot`

There is currently **no** runtime path from `useEvolutionProjection()` to `EvolutionProjection` or `EvolutionAdapter`.

## 2. Flag OFF path

### `NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6=false`

Dependency chain:

`useEvolutionProjection()`
↓
`useUserEvolution()`
↓
legacy evolution logic
↓
`EvolutionSnapshot`

Behavior:
- returns a normalized snapshot derived from legacy evolution state
- does not use `EvolutionProjection`
- does not use `EvolutionAdapter`

## 3. Flag ON path

### `NEXT_PUBLIC_ENABLE_EVOLUTION_PROJECTION_V6=true`

Dependency chain:

`useEvolutionProjection()`
↓
`useUserEvolution()`
↓
legacy evolution logic
↓
`EvolutionSnapshot`

Behavior:
- currently identical to the flag-off path
- `EvolutionProjection` is not called directly or indirectly
- the flag does not switch the hook onto the canonical projection stack

## 4. Architecture compliance assessment

**Answer: NO**

The current implementation does **not** satisfy:

`Consumer`
↓
`useEvolutionProjection`
↓
`EvolutionProjection`
↓
`EvolutionAdapter`
↓
`EvolutionSnapshot`

What remains to be changed:
- `useEvolutionProjection()` must stop reading `useUserEvolution()` directly
- the hook must call `EvolutionProjection.getSnapshot()`
- `EvolutionProjection` must remain the only path from the hook to the adapter
- the feature flag must actually choose between the legacy-compatible path and the canonical projection path

## 5. Recommendation

**REWORK PR-4**

Reason:
- the hook exists, but it is still wired to the legacy evolution stack
- the canonical projection stack is not reachable through the hook
- the feature flag is currently a no-op in practice because both branches return the same legacy-derived snapshot

## Evidence summary

- `useEvolutionProjection()` imports `useUserEvolution()` directly
- the hook does not import `EvolutionProjection`
- the returned snapshot is produced by `normalizeLegacySnapshot(evolution)`
- the feature flag currently returns `snapshot` in both branches
