# DS-008 Theme & Branding

## Status

Implemented.

## Scope

DS-008 adds the reusable Theme & Branding foundation for `@nextshift/ui`.

Included:

1. ThemeProvider
2. ThemeContext
3. Light theme
4. Dark theme
5. Brand theme overrides
6. White-label/OEM branding contracts
7. Theme switching helpers
8. Theme persistence contract
9. Theme utilities
10. Branding assets contract
11. Theme style helpers

## Package Surface

The slice extends `@nextshift/ui` through:

- `src/theme/*`
- `src/types/theme-types.ts`
- public exports from `src/index.ts`, `src/types/index.ts`, and `src/styles/index.ts`

## Persistence Boundary

Theme persistence is represented only as `ThemePersistenceContract`. DS-008 does not implement localStorage, cookies, backend storage, routing, runtime redesign, or business logic.

## Compatibility

DS-008 preserves DS-001 through DS-007 exports and consumes DS-001 token contracts for theme construction.
